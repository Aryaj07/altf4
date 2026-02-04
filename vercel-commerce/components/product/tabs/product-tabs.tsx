'use client';

import { useState } from 'react';
import { ProductDescriptionSections, ProductDescriptionSection } from '../product-description-sections';

type Tab = 'description' | 'reviews';

export function ProductTabs({ 
  productId, 
  descriptionSections,
  reviewsContent,
  reviewCount,
  reviewButton
}: { 
  productId: string;
  descriptionSections: ProductDescriptionSection[];
  reviewsContent: React.ReactNode;
  reviewCount?: number;
  reviewButton?: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('description');

  const tabs = [
    { id: 'description' as Tab, label: 'Product Description' },
    { id: 'reviews' as Tab, label: 'Reviews & Ratings', count: reviewCount }
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative pb-4 pt-2 px-1 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-black dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    {tab.count}
                  </span>
                )}
              </span>
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'description' && (
          <div className="animate-in fade-in duration-300">
            {descriptionSections.length > 0 ? (
              <ProductDescriptionSections sections={descriptionSections} />
            ) : (
              <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                <p>No product description available yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-in fade-in duration-300">
            {reviewButton && (
              <div className="mb-6">
                {reviewButton}
              </div>
            )}
            {reviewsContent}
          </div>
        )}
      </div>
    </div>
  );
}
