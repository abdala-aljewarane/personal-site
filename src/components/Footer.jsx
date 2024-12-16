import React from 'react';
import { FaTwitter, FaInstagram, FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

const Footer = () => {
  return (
    <footer className='w-full bg-gray-50 dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-800'>
      <div className='max-w-[1000px] mx-auto px-8'>
        <div className='flex flex-col items-center justify-center'>
          <div className='flex justify-center items-center space-x-4 mb-4'>
            <a href="mailto:aaljewarane@gmail.com" target="_blank" rel="noopener noreferrer" title="Email">
              <MdEmail className='cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors' size={20}/>
            </a>
            <a href="https://twitter.com/abd4latx" target="_blank" rel="noopener noreferrer" title="Twitter">
              <FaTwitter className='cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors' size={20}/>
            </a>
            <a href="https://www.instagram.com/abd4la" target="_blank" rel="noopener noreferrer" title="Instagram">
              <FaInstagram className='cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors' size={20}/>
            </a>
            <a href="https://www.linkedin.com/in/abd4la/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <FaLinkedinIn className='cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors' size={20}/>
            </a>
            <a href="https://github.com/abdala-aljewarane" target="_blank" rel="noopener noreferrer" title="GitHub">
              <FaGithub className='cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors' size={20}/>
            </a>
          </div>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>© {new Date().getFullYear()} Abdala Aljewarane. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
