import React, { useState, useEffect } from 'react';
import { BsCalendar, BsX } from 'react-icons/bs';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, "blog-posts"), 
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate().toLocaleDateString() || 'No date'
        }));
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (e, postId) => {
    e.preventDefault(); // Prevent navigation to post view
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, "blog-posts", postId));
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className='w-full min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-gray-600'>Loading posts...</div>
      </div>
    );
  }

  return (
    <div id='blog' className='w-full min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-[1000px] mx-auto p-8'>
        <h2 className='text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white'>blog</h2>
        
        {posts.length === 0 ? (
          <div className='text-center text-gray-600 dark:text-gray-400'>
            No blog posts yet.
          </div>
        ) : (
          <div className='grid gap-8 md:grid-cols-2'>
            {posts.map((post) => (
              <div key={post.id} className='relative'>
                <Link 
                  to={`/blog/${post.id}`}
                  className='block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300'
                >
                  <div className='flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-3'>
                    <BsCalendar size={16} />
                    <span className='text-sm'>{post.date}</span>
                  </div>
                  
                  <h3 className='text-2xl font-bold mb-2 text-gray-900 dark:text-white'>{post.title}</h3>
                  <p className='text-gray-600 dark:text-gray-400 mb-4'>{post.preview}</p>
                  
                  <div className='flex flex-wrap gap-2 mb-4'>
                    {post.tags && post.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className='bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className='text-gray-500 dark:text-gray-400 text-sm'>
                    By {post.author}
                  </div>
                </Link>
                {isAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, post.id)}
                    className='absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200'
                    title="Delete post"
                  >
                    <BsX size={24} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog; 