'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type ReviewImage = {
  id: string;
  url: string;
};

export function ReviewImageGallery({ images }: { images: ReviewImage[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
  };

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Add keyboard listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage]);

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={img.id ?? idx}
            onClick={() => openGallery(idx)}
            className="relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 cursor-pointer group border-2 border-transparent hover:border-blue-500 transition-all"
          >
            <Image
              src={img.url || "/placeholder.svg"}
              alt={`Review image ${idx + 1}`}
              width={100}
              height={100}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover group-hover:scale-110 transition-transform duration-200"
            />
            {/* Overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Click to view
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeGallery}
        >
          {/* Close Button */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Image */}
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {images[currentIndex] && (
              <Image
                src={images[currentIndex].url}
                alt={`Review image ${currentIndex + 1}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                priority
              />
            )}
          </div>

          {/* Thumbnail Strip (bottom) */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/50 p-2 rounded-full backdrop-blur-sm max-w-[90vw] overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id ?? idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`relative flex-shrink-0 rounded overflow-hidden transition-all ${
                    idx === currentIndex 
                      ? 'ring-2 ring-white scale-110' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    width={60}
                    height={60}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
