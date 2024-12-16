import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BlogPost = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState({
    title: '',
    preview: '',
    content: '',
    tags: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Not authorized');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      await addDoc(collection(db, 'blog-posts'), {
        ...post,
        date: serverTimestamp(),
        tags: post.tags.split(',').map(tag => tag.trim()),
        author: 'Abdala Aljewarane'
      });
      
      setSuccess('Post created successfully!');
      setTimeout(() => {
        navigate('/blog');
      }, 2000);
    } catch (error) {
      setError('Error creating post: ' + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 font-semibold">Not authorized to access this page.</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-[1000px] mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Create New Blog Post</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({...post, title: e.target.value})}
              className="w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Preview Text
            </label>
            <input
              type="text"
              value={post.preview}
              onChange={(e) => setPost({...post, preview: e.target.value})}
              className="w-full p-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
              placeholder="Brief preview of the post"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Content
            </label>
            <textarea
              value={post.content}
              onChange={(e) => setPost({...post, content: e.target.value})}
              className="w-full p-3 border rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Write your blog post content here..."
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={post.tags}
              onChange={(e) => setPost({...post, tags: e.target.value})}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Technology, Programming, Web Development"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogPost; 