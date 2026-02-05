import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * POST /admin/cleanup-review-images
 * Manually trigger cleanup of duplicate review images
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  console.log('Manual cleanup of duplicate review images triggered...');
  
  const query = req.scope.resolve("query");
  
  try {
    // Get all reviews with their images
    const { data: reviews } = await query.graph({
      entity: "product_review",
      fields: ["id", "images.*"],
    });

    if (!reviews || reviews.length === 0) {
      return res.json({ message: 'No reviews found', duplicatesDeleted: 0 });
    }

    console.log(`Checking ${reviews.length} reviews for duplicates...`);

    let totalDuplicatesFound = 0;
    const allDuplicateIds: string[] = [];

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
          console.log(`Review ${review.id}: Found ${images.length} copies of ${url}`);
          totalDuplicatesFound += duplicateIds.length;
          allDuplicateIds.push(...duplicateIds);
        }
      });
    }

    if (allDuplicateIds.length > 0) {
      console.log(`\nFound ${allDuplicateIds.length} total duplicates across all reviews`);
      console.log(`Deleting: ${allDuplicateIds.join(', ')}`);
      
      // Get review module service
      const reviewModuleService = req.scope.resolve("review") as any;
      
      // Delete using the service
      await reviewModuleService.deleteProductReviewImage(allDuplicateIds);
      
      console.log('✓ Successfully deleted all duplicates\n');
      
      return res.json({
        success: true,
        message: `Successfully deleted ${allDuplicateIds.length} duplicate images`,
        duplicatesDeleted: allDuplicateIds.length,
        deletedIds: allDuplicateIds
      });
    } else {
      console.log('No duplicates found across all reviews\n');
      return res.json({
        success: true,
        message: 'No duplicate images found',
        duplicatesDeleted: 0
      });
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    return res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
