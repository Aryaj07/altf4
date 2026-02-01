'use client';

import Image from 'next/image';

export function ProductDetailsImages({ 
  images 
}: { 
  images: { src: string; altText: string }[] 
}) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Product Details</h2>
      {images.map((image, index) => (
        <div key={`${image.src}-${index}`} className="relative w-full mb-4">
          <Image
            src={image.src}
            alt={image.altText || `Product detail ${index + 1}`}
            width={1500}
            height={0}
            style={{ height: 'auto', width: '100%' }}
            className="object-contain rounded-lg"
            loading="lazy"
          />
        </div>
      ))}
    </>
  );
}
