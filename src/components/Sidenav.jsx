import React, { useState } from 'react';
import { AiOutlineHome, AiOutlineMenu, AiOutlineUser } from 'react-icons/ai';
import { BsBriefcase, BsPencil, BsPencilSquare } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidenav = () => {
  const { isAdmin } = useAuth();
  const [nav, setNav] = useState(false);
  const handleNav = () => {
    setNav(!nav);
  };

  return (
    <div>
      <AiOutlineMenu
        onClick={handleNav}
        className='absolute top-5 right-4 z-[99] md:hidden'
        title="Menu"
      />

      {nav ? (
        <div className='fixed w-full h-screen bg-white/90 dark:bg-gray-900/90 flex flex-col justify-center items-center z-[20]'>
          <a
            href='/#main'
            className='w-[75%] flex justify-center items-center rounded-full shadow-lg bg-gray-100 dark:bg-gray-800 shadow-gray-400 dark:shadow-gray-900 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-200'
            title="Home"
          >
            <AiOutlineHome size={20} className="dark:text-gray-300" />
            <span className='pl-4 dark:text-gray-300'>Home</span>
          </a>
          <a
            href='/#about'
            className='w-[75%] flex justify-center items-center rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-200'
            title="About"
          >
            <AiOutlineUser size={20} />
            <span className='pl-4'>About</span>
          </a>
          <a
            href='/#experience'
            className='w-[75%] flex justify-center items-center rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-200'
            title="Experience"
          >
            <BsBriefcase size={20} />
            <span className='pl-4'>Experience</span>
          </a>
          <Link 
            to="/blog" 
            className='w-[75%] flex justify-center items-center rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-200'
            title="Blog"
          >
            <BsPencil size={20} />
            <span className='pl-4'>Blog</span>
          </Link>
          {isAdmin && (
            <Link 
              to="/admin/post"
              className='rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300'
              title="New Post"
            >
              <BsPencilSquare size={20}/>
            </Link>
          )}
        </div>
      ) : (
        ''
      )}
      <div className='md:block hidden fixed top-[25%] z-10'>
        <div className='flex flex-col'>
          <a 
            href="/#main" 
            className='rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300'
            title="Home"
          >
            <AiOutlineHome size={20}/>
          </a>
          <a 
            href="/#about" 
            className='rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300'
            title="About"
          >
            <AiOutlineUser size={20}/>
          </a>
          <a 
            href="/#experience" 
            className='rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300'
            title="Experience"
          >
            <BsBriefcase size={20}/>
          </a>
          <Link 
            to="/blog"
            className='rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300'
            title="Blog"
          >
            <BsPencil size={20}/>
          </Link>
          {isAdmin && (
            <Link 
              to="/admin/post"
              className='rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300'
              title="New Post"
            >
              <BsPencilSquare size={20}/>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidenav;
