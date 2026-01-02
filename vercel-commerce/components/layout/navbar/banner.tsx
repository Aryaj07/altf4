'use client';

import { useState, useEffect } from 'react';

const messages = [
  // { text: 'Order MAD 68 PRO & save ₹333 (auto applied on checkout)! 🚀', link: null },
  // { text: 'Order MAD 68 HE & save ₹200 (auto applied on checkout)! 🚀', link: null },
  // { text: '🎄 Christmas & End of Year Sale: ₹100 OFF above ₹4,000 | ₹200 OFF above ₹5,000! 🎊', link: null },
  { text: 'Free shipping on orders over ₹999! 🎉', link: null },
  { text: 'Free skates (random) on all keyboard and mouse orders! 🎉', link: null },
];

export default function Banner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black text-white text-center py-3 px-4 text-base overflow-hidden relative h-10">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            index === currentIndex
              ? 'opacity-100 translate-y-0'
              : index < currentIndex
              ? 'opacity-0 -translate-y-full'
              : 'opacity-0 translate-y-full'
          }`}
        >
          {message.link ? (
            <a 
              href={message.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {message.text}
            </a>
          ) : (
            message.text
          )}
        </div>
      ))}
    </div>
  );
}