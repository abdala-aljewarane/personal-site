import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BsCalendar, BsTrash } from 'react-icons/bs';

const BlogView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "blog-posts", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPost({
            id: docSnap.id,
            ...docSnap.data(),
            date: docSnap.data().date?.toDate().toLocaleDateString() || 'No date'
          });
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "blog-posts", id));
      navigate('/blog');
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className='w-full min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-gray-600'>Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className='w-full min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-gray-600'>Post not found</div>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen bg-gray-50 py-12'>
      <div className='max-w-[800px] mx-auto px-8'>
        <article className='bg-white p-8 rounded-lg shadow-md'>
          <div className='flex justify-between items-start mb-4'>
            <div className='flex items-center space-x-2 text-gray-600'>
              <BsCalendar size={16} />
              <span className='text-sm'>{post.date}</span>
            </div>
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className='text-red-500 hover:text-red-700 transition-colors duration-200'
                title="Delete post"
              >
                <BsTrash size={20} />
              </button>
            )}
          </div>
          
          <h1 className='text-4xl font-bold mb-6'>{post.title}</h1>
          
          <div className='flex flex-wrap gap-2 mb-6'>
            {post.tags && post.tags.map((tag, index) => (
              <span 
                key={index}
                className='bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm'
              >
                {tag}
              </span>
            ))}
          </div>

          <div className='prose max-w-none'>
            <div className='text-gray-700 whitespace-pre-wrap'>
              {post.content}
            </div>
          </div>
          
          <div className='mt-8 pt-4 border-t text-gray-500'>
            Written by {post.author}
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogView; 