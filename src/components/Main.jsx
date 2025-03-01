import React, { useState, useEffect } from 'react';
import {FaTwitter, FaInstagram, FaLinkedinIn, FaGithub, FaMusic, FaMoon, FaSun} from 'react-icons/fa';
import {MdEmail} from 'react-icons/md';
import {TypeAnimation} from 'react-type-animation';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Main = () => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const fetchRecentTrack = async () => {
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=abd4la&api_key=${import.meta.env.VITE_LASTFM_API_KEY}&format=json&limit=1`
        );
        const data = await response.json();
        const track = data.recenttracks.track[0];
        setCurrentTrack({
          name: track.name,
          artist: track.artist['#text'],
          isNowPlaying: track['@attr']?.nowplaying === 'true'
        });
      } catch (error) {
        console.error('Error fetching track:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTrack();
    // Fetch every 30 seconds
    const interval = setInterval(fetchRecentTrack, 30000);
    return () => clearInterval(interval);
  }, []);

  const themeToggle = (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <FaSun className="text-yellow-400" size={20} />
      ) : (
        <FaMoon className="text-gray-600" size={20} />
      )}
    </button>
  );

  return (
    <>
      <div id='main' className='w-full h-screen bg-white dark:bg-gray-900 transition-colors duration-200'>
        <div className='max-w-[1000px] m-auto h-full w-full flex flex-row justify-between items-center px-8'>
          <div className='flex flex-col justify-center'>
            <h1 className='sm:text-4xl text-4xl font-bold text-gray-900 dark:text-white'>abdala aljewarane</h1>
            <h2 className='sm:text-3xl text-2xl pt-4 text-gray-800 dark:text-gray-200'>
              a computer science student passionate about building
            </h2>
            <div className='sm:text-3xl text-2xl text-gray-800'>
              <TypeAnimation
                sequence={[
                  '',
                  1000,
                  'distributed systems',
                  1000,
                  'scalable web applications',
                  1000,
                  'mobile apps',
                  1000,
                  'machine learning models',
                  1000,
                  'innovative software solutions',
                  1000,
                  () => console.log('done')
                ]}
                wrapper="div"
                cursor={true}
                repeat={Infinity}
                className="text-gray-900 dark:text-white"
              />
            </div>

            {/* Last.fm Current Track */}
            <div className='flex items-center space-x-2 mt-4 text-gray-600'>
              <FaMusic className='text-gray-400' size={16} />
              {loading ? (
                <span className='text-sm'>Loading music...</span>
              ) : currentTrack ? (
                <div className='text-sm'>
                  {currentTrack.isNowPlaying ? 'Now playing: ' : 'Last played: '}
                  <span className='font-medium'>{currentTrack.name}</span>
                  <span className='text-gray-400'> by </span>
                  <span className='font-medium'>{currentTrack.artist}</span>
                </div>
              ) : (
                <span className='text-sm'>No recent tracks</span>
              )}
            </div>

            <Link 
              to="/blog" 
              className='text-gray-600 hover:text-gray-800 mt-4 text-lg transition-colors duration-200 cursor-pointer'
            >
              read my blog →
            </Link>
            <div className='flex justify-start items-center space-x-4 mt-4'>
              <a href="mailto:aaljewarane@gmail.com" target="_blank" rel="noopener noreferrer" title="Email">
                <MdEmail className='cursor-pointer hover:text-gray-600' size={20}/>
              </a>
              <a href="https://twitter.com/abd4latx" target="_blank" rel="noopener noreferrer" title="Twitter">
                <FaTwitter className='cursor-pointer hover:text-gray-600' size={20}/>
              </a>
              <a href="https://www.instagram.com/abd4la" target="_blank" rel="noopener noreferrer" title="Instagram">
                <FaInstagram className='cursor-pointer hover:text-gray-600' size={20}/>
              </a>
              <a href="https://www.linkedin.com/in/abd4la/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <FaLinkedinIn className='cursor-pointer hover:text-gray-600' size={20}/>
              </a>
              <a href="https://github.com/abdala-aljewarane" target="_blank" rel="noopener noreferrer" title="GitHub">
                <FaGithub className='cursor-pointer hover:text-gray-600' size={20}/>
              </a>
              {themeToggle}
            </div>
          </div>
          
          <div className='hidden md:block'>
            <img 
              src='/Headshot.png' 
              alt='Abdala Aljewarane'
              className='rounded-full w-64 h-64 object-cover border-4 border-gray-200 shadow-lg'
            />
          </div>
        </div>
      </div>

      <div id='about' className='w-full h-screen bg-gray-50 dark:bg-gray-800'>
        <div className='max-w-[1000px] mx-auto p-8 flex flex-col justify-center h-full'>
          <div>
            <h2 className='text-4xl font-bold mb-4 text-gray-900 dark:text-white'>about me</h2>
            <h3 className='text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300'>
              computer science student & developer
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>
              i was born in baghdad, iraq and moved to the united states when i was 5 years old (2009). 
              i've lived in the dfw metroplex since then so i consider myself a texan by heart.
            </p>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>
              i'm currently a student at the university of texas at dallas and i'm pursuing a b.s. 
              in computer science. my interests are in distributed systems, scalable web applications, 
              and mobile development and i'm currently looking for internships for the summer of 2025 and winter of 2025.
            </p>
            <p className='text-gray-600 dark:text-gray-400'>
              outside of software development, i enjoy playing video games, playing basketball (go mavs), and running.

              i used to play Overwatch 2 <a href="https://liquipedia.net/overwatch/Abdala" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">semi-professionally</a> and was at one point ranked <a href="https://cdn.discordapp.com/attachments/1123342221652013188/1315097503934447747/image0.jpg?ex=67562b7e&is=6754d9fe&hm=e21bea358bc741a424b6ec3ed6a7b4b45ae45ad4cc8b33740b8f5c69809c42e9&" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">number 1</a> in the world
              i also founded an esports organization called <a href="https://liquipedia.net/overwatch/DarkMode_NA" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">DM Esports & Apparel</a> and raised funding for the organization all while in high school.  
              i've put the organization on hold for now but i'm looking to start it back up in the future as purely an apparel brand.
            </p>
                  

          </div>
        </div>
      </div>

      <div id='experience' className='w-full min-h-screen bg-white dark:bg-gray-900'>
        <div className='max-w-[1000px] mx-auto p-4 md:p-8'>
          <h2 className='text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-gray-900 dark:text-white'>experience</h2>
          
          <div className='flex flex-col md:flex-row justify-between gap-8'>
            {/* Professional Experience Column */}
            <div className='flex flex-col items-center space-y-4 md:space-y-8 w-full md:w-[30%]'>
              <h3 className='text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-4'>professional</h3>
              
              {/* GitHub */}
              <div className='w-24 h-24 flex-shrink-0 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 overflow-hidden'>
                <img 
                  src='/github-logo.png' 
                  alt='GitHub'
                  className='w-full h-full object-contain p-2'
                />
              </div>
              <div className='text-center'>
                <h3 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>GitHub</h3>
                <h4 className='text-lg md:text-xl text-gray-700 dark:text-gray-300'>Incoming Software Engineer Intern</h4>
                <p className='text-sm md:text-base text-gray-600 italic dark:text-gray-500'>May 2025 - August 2025</p>
                <p className='text-sm md:text-base text-gray-600 dark:text-gray-500'>New York City, NY</p>
              </div>

              {/* Vertical Line */}
              <div className='w-0.5 h-16 bg-gray-300'></div>

              {/* L3Harris */}
              <div className='w-24 h-24 flex-shrink-0 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 overflow-hidden'>
                <img 
                  src='/logo.png' 
                  alt='L3Harris'
                  className='w-full h-full object-contain p-2'
                />
              </div>
              <div className='text-center'>
                <h3 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>L3Harris Technologies</h3>
                <h4 className='text-lg md:text-xl text-gray-700 dark:text-gray-300'>Software Engineering Intern</h4>
                <p className='text-sm md:text-base text-gray-600 italic dark:text-gray-500'>May 2024 - August 2024</p>
                <p className='text-sm md:text-base text-gray-600 dark:text-gray-500'>Greenville, TX</p>
              </div>

              {/* Vertical Line */}
              <div className='w-0.5 h-16 bg-gray-300'></div>

              {/* Apple */}
              <div className='w-24 h-24 flex-shrink-0 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 overflow-hidden'>
                <img 
                  src='/Apple.png'
                  alt='Apple'
                  className='w-full h-full object-contain p-2'
                />
              </div>
              <div className='text-center'>
                <h3 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>Apple</h3>
                <h4 className='text-lg md:text-xl text-gray-700 dark:text-gray-300'>Information Security Intern</h4>
                <p className='text-sm md:text-base text-gray-600 italic dark:text-gray-500'>May 2023 - August 2023</p>
                <p className='text-sm md:text-base text-gray-600 dark:text-gray-500'>Remote</p>
              </div>
            </div>

            {/* Vertical Divider - Only show on desktop */}
            <div className='hidden md:block w-0.5 h-full bg-gray-300'></div>

            {/* Education Column */}
            <div className='flex flex-col items-center space-y-4 md:space-y-8 w-full md:w-[30%]'>
              <h3 className='text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-4'>education</h3>
              
              {/* UTD */}
              <div className='w-24 h-24 flex-shrink-0 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 overflow-hidden'>
                <img 
                  src='/UTDlogo.png' 
                  alt='University of Texas at Dallas'
                  className='w-full h-full object-contain p-2'
                />
              </div>
              <div className='text-center'>
                <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>University of Texas at Dallas</h3>
                <h4 className='text-xl text-gray-700 dark:text-gray-300'>Bachelor of Science in Computer Science</h4>
                <p className='text-gray-600 italic dark:text-gray-500'>Expected Graduation: May 2026</p>
                <p className='text-gray-600 dark:text-gray-500'>Richardson, TX</p>
              </div>
            </div>

            {/* Vertical Divider - Only show on desktop */}
            <div className='hidden md:block w-0.5 h-full bg-gray-300'></div>

            {/* Miscellaneous Experience Column */}
            <div className='flex flex-col items-center space-y-4 md:space-y-8 w-full md:w-[30%]'>
              <h3 className='text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-4'>miscellaneous</h3>
              
              {/* Add your miscellaneous experiences here with the same styling */}
              <div className='w-24 h-24 flex-shrink-0 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 overflow-hidden'>
                <img 
                  src='/dmlogo.png' 
                  alt='Overwatch'
                  className='w-full h-full object-contain p-2'
                />
              </div>
              <div className='text-center'>
              <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
                <a 
                  href="https://liquipedia.net/overwatch/DarkMode_NA"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                >
                  DM Esports & Apparel
                </a>
              </h3>
                <h4 className='text-xl text-gray-700 dark:text-gray-300'>Founder</h4>
                <p className='text-gray-600 italic dark:text-gray-500'>2018 - Present</p>
                <p className='text-gray-600 dark:text-gray-500'></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Divider - Only show on mobile */}
      <div className='block md:hidden w-full h-0.5 bg-gray-300 my-8'></div>
    </>
  );
}

export default Main;
