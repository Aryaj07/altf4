import clsx from 'clsx';
import React from 'react';
import Image from 'next/image';

// Assuming your 512x512 PNG is at this path
import yourLogo from './android-chrome-512x512.png'; 

export default function LogoIcon(props: React.ComponentProps<'div'>) {
  return (
    // The parent div gives the image its displayed size (h-4 w-4)
    // and `relative` positioning for the `fill` prop.
    <div
      {...props}
      className={clsx(
        'relative h-4 w-4 rounded-md overflow-hidden', // Added rounded-md and overflow-hidden to match the app icon shape
        props.className
      )}
    >
      <Image
        src={yourLogo}
        alt={`${process.env.SITE_NAME} logo`}
        fill // Make the image fill its parent container
        className="object-contain" // Ensures the logo fits without cropping
      />
    </div>
  );
}