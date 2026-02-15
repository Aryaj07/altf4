'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { Gallery } from 'components/product/gallery';
import { ProductDescriptionWrapper } from 'components/product/product-description-wrapper';
import { Product, ProductVariant } from 'lib/medusa/types';

const isDetailImage = (image: { src: string; altText: string; width?: number; height?: number }) => {
  if (image.width && image.height) {
    return image.height > image.width * 2.5;
  }
  return /detail|description|spec|specification/i.test(image.src) || 
         /detail|description|spec|specification/i.test(image.altText);
};

export function ProductPageClient({ 
  product,
  allImages 
}: { 
  product: Product;
  allImages: { src: string; altText: string; width?: number; height?: number }[];
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.[0]
  );
  
  const galleryImages = useMemo(() => allImages.filter(img => !isDetailImage(img)), [allImages]);
  
  const [displayImages, setDisplayImages] = useState(galleryImages);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const prevVariantIdRef = useRef<string | undefined>(undefined);

  const handleVariantChange = useCallback((variant: ProductVariant | undefined) => {
    setSelectedVariant(variant);

    // Only reorder images and reset index if the variant actually changed
    const newVariantId = variant?.id;
    if (newVariantId === prevVariantIdRef.current) return;
    prevVariantIdRef.current = newVariantId;

    if (!variant) {
      setDisplayImages(galleryImages);
      return;
    }

    // Try to find the variant's image in the gallery
    const variantThumb = (variant as any).thumbnail;
    
    if (variantThumb) {
      // Try exact match first
      let matchIndex = galleryImages.findIndex(img => img.src === variantThumb);
      
      // Try partial match (URL might differ in protocol or query params)
      if (matchIndex === -1) {
        const thumbPath = variantThumb.split('/').pop()?.split('?')[0];
        matchIndex = galleryImages.findIndex(img => {
          const imgPath = img.src.split('/').pop()?.split('?')[0];
          return imgPath === thumbPath;
        });
      }

      if (matchIndex !== -1) {
        const variantImage = galleryImages[matchIndex]!;
        const otherImages = galleryImages.filter((_, i) => i !== matchIndex);
        setDisplayImages([variantImage, ...otherImages]);
        setCurrentImageIndex(0);
      } else {
        setDisplayImages(galleryImages);
        setCurrentImageIndex(0);
      }
    } else {
      setDisplayImages(galleryImages);
      setCurrentImageIndex(0);
    }
  }, [galleryImages]);

  return (
    <>
      <div className="h-full w-full basis-full lg:basis-4/6">
        <Gallery
          images={displayImages}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />
      </div>

      <div className="basis-full lg:basis-2/6">
        <ProductDescriptionWrapper 
          product={product} 
          onVariantChange={handleVariantChange}
        />
      </div>
    </>
  );
}
