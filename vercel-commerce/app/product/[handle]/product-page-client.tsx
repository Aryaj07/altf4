'use client';

import { useState, useEffect, useMemo } from 'react';
import { Gallery } from 'components/product/gallery';
import { ProductDescriptionWrapper } from 'components/product/product-description-wrapper';
import { Product, ProductVariant } from 'lib/medusa/types';

// Helper to check if image is a detail/description image (tall images)
const isDetailImage = (image: { src: string; altText: string; width?: number; height?: number }) => {
  // If we have dimensions, check aspect ratio (height > width * 2.5 means it's a detail image)
  if (image.width && image.height) {
    return image.height > image.width * 2.5;
  }
  // Fallback: check if filename contains keywords
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
  
  // Separate gallery images from detail images using useMemo
  const galleryImages = useMemo(() => allImages.filter(img => !isDetailImage(img)), [allImages]);
  
  const [displayImages, setDisplayImages] = useState(galleryImages);

  useEffect(() => {
    console.log('[GALLERY] Gallery images:', galleryImages.length);
    console.log('[GALLERY] Selected variant:', selectedVariant);
    
    if (selectedVariant?.thumbnail) {
      console.log('[GALLERY] Variant changed:', {
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        thumbnail: selectedVariant.thumbnail,
        selectedOptions: selectedVariant.selectedOptions
      });

      // Filter images based on variant thumbnail (only from gallery images)
      const variantThumbnailUrl = selectedVariant.thumbnail;
      
      const variantImage = galleryImages.find(img => img.src === variantThumbnailUrl);
      const otherImages = galleryImages.filter(img => img.src !== variantThumbnailUrl);
      
      if (variantImage) {
        console.log('[GALLERY] Reordering images - variant image first:', {
          variantImage: variantImage.src,
          totalImages: [variantImage, ...otherImages].length
        });
        setDisplayImages([variantImage, ...otherImages]);
      } else {
        console.log('[GALLERY] Variant thumbnail not found in product images:', {
          variantThumbnail: variantThumbnailUrl,
          availableImages: galleryImages.map(img => img.src)
        });
        setDisplayImages(galleryImages);
      }
    } else {
      console.log('[GALLERY] No variant thumbnail, using all gallery images');
      setDisplayImages(galleryImages);
    }
  }, [selectedVariant, galleryImages]);

  return (
    <>
      {/* Left column: Gallery */}
      <div className="h-full w-full basis-full lg:basis-4/6">
        <Gallery
          images={displayImages}
        />
      </div>

      {/* Right column: Product description */}
      <div className="basis-full lg:basis-2/6">
        <ProductDescriptionWrapper 
          product={product} 
          onVariantChange={setSelectedVariant}
        />
      </div>
    </>
  );
}
