import React from 'react';
import {FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaFacebookF, FaLinkedinIn} from 'react-icons/fa';
import {TypeAnimation} from 'react-type-animation';
import { Link } from 'react-router-dom';
import Sidenav from './Sidenav';

const Main = () => {
  return (
    <div id='main'>
        <img src=''
        className='w-full h-screen object-cover object-left scale-x-[-1]' src="https://asana-user-private-us-east-1.s3.amazonaws.com/assets/1205454877608213/1206598658504554/eddb086edaf4e1119a7a7ef517ae1846?X-Amz-Security-Token=IQoJb3JpZ2luX2VjECUaCXVzLWVhc3QtMSJIMEYCIQDyyrllhFfZT3YDA%2FSloQGkMQM%2FF0HYz18JdPmasOeMOgIhAMPOteJRlL7bFkFsQe67Hq%2FGqYH1GPGWacienQ5dBgG8KrEFCE0QABoMNDAzNDgzNDQ2ODQwIgwNUHXTa8wWmW4ZjZ0qjgUWVC7mxe0la1a6%2Bc5xzIrlE4ALaH0da1PExEr%2BpODE8p%2BDe0tUeDLZCyE8GQTErxiOi7lgEx7UU5OXO20cCbhqM%2B5FP9OSGXKgHa6GskrlHC8hElj7Zfjuyx6m7%2F%2B11TRPVmGKNHja4JEXrzDrcrwLvdOZm%2FzQO65zIaOYEtlDS9rBYDleu2%2BjpOvHdOp2Li5IJ3pvAJ6ZZjjdxw69OSuNvziHLDGT8EKRQW82qxqWZnqRph19WWxt10NeS8JUGOcOcsWrL5qgncbd6iovODKmBhNyMAb0nfld7%2BJbJDyAjgPP9qBilW6%2F4aJhd7IsIuucZ7ifskM4WwOT7pj2mCTvqnnMAC4DAb5Sj%2B%2FRWf68Pp9XlKChyz2EfZFCCWD%2FrvLCrTrZtzAYcV%2BMicOa3R5oIZW%2FltrhGVq6PSZSpGHF3Sw50b8UyQkUrta%2FWVfQS1S1VH3quGJKly8n6Q913a38b1CUaZKIvu6840igewVMncFBq8kygl%2BFqqCOy85YByad4QIItA6qEoK%2F0lSMLyMSBfTptq4hCKy2h9YJ5k41CQfxIVS%2B1bhR%2FmVXMdfYq%2BdwKGShGV10OKIxybJrT31G4Iwr4gCVe3a8LvcsoMbIGPFNKYfBnf2amWV6wKCpEaVM9VonsbCcfYsS%2BBR%2BDQ7Z0s%2BTAzYU5qwc5bhrjZFtnFgsvEKwOLB5BrlpKkG0PzZk5B4KoR8vvNHMNNj%2FVfb8nPKb2MKijQYggPSJeAcINcZVLOJ2Lnl0v1ujWKmyRvD9FxewhVRlqeJN0vhcbX%2FBhWDsoSjS0df1uAiuN69MLoBk3PL0c6RZjffxXWdQhBh%2B0GPAHpjv1Jod41nnXDwT2Tt3x3s5HT4rJARGbScwp62ssAY6sAFSn7EjJeQ9hs5CyxIqAooGRJW50u34BLWTbKuv96vWswNeDG4TZQ4eG9SOfIX0c9F%2BVWmunQz78yKv7o6SFSwY%2Bip9rQlAG%2FkpGFJhH7A%2B7S4vMTBZHIMDFELFAcpK584KoOAPRSBm3W5CdJ5g9GlddpUeqmZeI2OMABTEKjSdO45zRPS%2Fqc%2FlPgvuGkxN2dIiZeLJ51NsnBjXlaRek%2FDPAbbHU4ahKF2MDiv4VqEfgw%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240401T212641Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1800&X-Amz-Credential=ASIAV34L4ZY4F467FI4T%2F20240401%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=ad1c9f5c551335caa66e5bc94f559794b12f17e87a2995586ea41c4e5ce9b23b#_=_">
        </img>

        <div className='w-full h-screen absolute top-0 left-0 '>
          <div className='max-w-[400px] m-auto h-full w-full flex flex-col justify-center lg:items-start items-center'>
          <h1 className='sm:text-5xl text-4xl font-bold '>Teen Bizz App</h1>
          

        
        <div>
          <h1></h1>
          <h2 className='flex sm:text-3xl text-2xl pt-4 text-gray-800'>
            A tool to create
            <TypeAnimation
              sequence={[
                'logos',
                1000,
                'websites',
                1000,
                'apps',
                1000,
                'designs',
                1000,
                'anything!',
                1000, // Duration to wait before starting over
                () => console.log('done')
              ]}
              wrapper="div"
              cursor={true}
              repeat={Infinity}
              style={{fontSize: '1em', paddingLeft: '5px', color : 'black'}}
            />
          </h2>
          <div>
          <div className='flex justify-center items-center space-x-4 mt-4'>
  <a href="https://twitter.com/targetevolution" target="_blank" rel="noopener noreferrer">
    <FaTwitter className='cursor-pointer' size={20}/>
  </a>
  <a href="https://www.facebook.com/targetevolution" target="_blank" rel="noopener noreferrer">
    <FaFacebookF className='cursor-pointer' size={20}/>
  </a>
  <a href="https://www.instagram.com/targetevolution" target="_blank" rel="noopener noreferrer">
    <FaInstagram className='cursor-pointer' size={20}/>
  </a>
  <a href="https://www.linkedin.com/company/targetevolution/" target="_blank" rel="noopener noreferrer">
    <FaLinkedinIn className='cursor-pointer' size={20}/>
  </a>



          </div>
        </div>
    </div>
    </div>
    </div>
    </div>
  );
}

export default Main;
