'use client';

import Image from 'next/image';

export type ProductDescriptionSection = {
  id: string;
  product_id: string;
  title?: string;
  content?: string;
  image_url?: string;
  template: 'image_left_text_right' | 'image_right_text_left' | 'full_width_image';
  order: number;
  metadata?: any;
};

export function ProductDescriptionSections({ 
  sections 
}: { 
  sections: ProductDescriptionSection[] 
}) {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8 md:space-y-12">
      {sortedSections.map((section) => (
        <div key={section.id}>
          {section.template === 'image_left_text_right' && (
            <ImageLeftTextRight section={section} />
          )}
          {section.template === 'image_right_text_left' && (
            <ImageRightTextLeft section={section} />
          )}
          {section.template === 'full_width_image' && (
            <FullWidthImage section={section} />
          )}
        </div>
      ))}
    </div>
  );
}

// Template 1: Image on left, text on right (like G75 Series)
function ImageLeftTextRight({ section }: { section: ProductDescriptionSection }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
      {/* Image */}
      {section.image_url && (
        <div className="relative w-full aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
          <Image
            src={section.image_url}
            alt={section.title || 'Product image'}
            fill
            className="object-contain p-4"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="space-y-4 lg:space-y-6">
        {section.title && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {section.title}
          </h2>
        )}
        
        {section.content && (
          <div 
            className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed prose prose-sm md:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        )}
      </div>
    </div>
  );
}

// Template 1b: Image on right, text on left (reverse layout)
function ImageRightTextLeft({ section }: { section: ProductDescriptionSection }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
      {/* Content - First on mobile, stays left on desktop */}
      <div className="space-y-4 lg:space-y-6 order-2 lg:order-1">
        {section.title && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {section.title}
          </h2>
        )}
        
        {section.content && (
          <div 
            className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed prose prose-sm md:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        )}
      </div>
      
      {/* Image - Second on mobile, stays right on desktop */}
      {section.image_url && (
        <div className="relative w-full aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center order-1 lg:order-2">
          <Image
            src={section.image_url}
            alt={section.title || 'Product image'}
            fill
            className="object-contain p-4"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      )}
    </div>
  );
}

// Template 2: Full width image (like the Gasket Structure image)
function FullWidthImage({ section }: { section: ProductDescriptionSection }) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Title */}
      {section.title && (
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
          {section.title}
        </h2>
      )}
      
      {/* Content (if any text above image) */}
      {section.content && (
        <div 
          className="text-sm md:text-base text-center text-neutral-700 dark:text-neutral-300 leading-relaxed prose prose-sm md:prose-base dark:prose-invert max-w-3xl mx-auto"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}
      
      {/* Image */}
      {section.image_url && (
        <div className="relative w-full rounded-2xl overflow-hidden">
          <Image
            src={section.image_url}
            alt={section.title || 'Product detail'}
            width={1600}
            height={900}
            className="w-full h-auto"
            sizes="100vw"
          />
        </div>
      )}
    </div>
  );
}
