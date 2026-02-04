/**
 * Cleanup Script for Duplicate Review Images
 * 
 * This script removes duplicate image entries from the product_review_image table
 * that are created by the @lambdacurry/medusa-product-reviews plugin
 * 
 * Run with: npx medusa exec ./src/scripts/cleanup-duplicate-review-images.ts
 */

export default async function cleanupDuplicateReviewImages({ container }: any) {
  console.log('Starting cleanup of duplicate review images...\n');
  
  const query = container.resolve("query");
  
  try {
    // Get all reviews with their images
    const { data: reviews } = await query.graph({
      entity: "product_review",
      fields: ["id", "images.*"],
    });

    if (!reviews || reviews.length === 0) {
      console.log('No reviews found');
      return;
    }

    console.log(`Found ${reviews.length} reviews to check\n`);

    let totalDuplicatesDeleted = 0;
    const sqlStatements: string[] = [];

    // Check each review for duplicate images
    for (const review of reviews) {
      if (!review.images || review.images.length === 0) continue;

      // Find duplicate URLs in this review
      const urlMap = new Map<string, any[]>();
      review.images.forEach((img: any) => {
        if (!urlMap.has(img.url)) {
          urlMap.set(img.url, []);
        }
        urlMap.get(img.url)!.push(img);
      });

      // Find duplicates
      urlMap.forEach((images, url) => {
        if (images.length > 1) {
          const duplicateIds = images.slice(1).map(img => img.id);
          console.log(`Review ${review.id}: ${url} has ${images.length} copies`);
          console.log(`  Deleting: ${duplicateIds.join(', ')}`);
          
          totalDuplicatesDeleted += duplicateIds.length;
          
          // Generate SQL for manual execution
          sqlStatements.push(
            `DELETE FROM product_review_image WHERE id IN ('${duplicateIds.join("','")}');`
          );
        }
      });
    }

    console.log(`\n========================================`);
    console.log(`Total duplicate images found: ${totalDuplicatesDeleted}`);
    console.log(`========================================\n`);

    if (sqlStatements.length > 0) {
      console.log('Run these SQL statements to clean up duplicates:\n');
      console.log('-- Start of cleanup SQL --');
      sqlStatements.forEach(sql => console.log(sql));
      console.log('-- End of cleanup SQL --\n');
      
      console.log('Or run this single statement:\n');
      console.log('-- Combined cleanup SQL --');
      console.log(sqlStatements.join('\n'));
      console.log('-- End combined SQL --\n');
    } else {
      console.log('✓ No duplicates found! Database is clean.\n');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
