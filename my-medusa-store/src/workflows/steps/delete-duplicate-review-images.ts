import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Client } from "pg";

export const deleteDuplicateReviewImagesStep = createStep(
  "delete-duplicate-review-images-step",
  async (imageIds: string[], { container }) => {
    console.log(`Step: Deleting ${imageIds.length} duplicate image(s)...`);
    
    if (imageIds.length === 0) {
      return new StepResponse({ deleted: 0 }, []);
    }
    
    try {
      // Create a direct PostgreSQL connection using the same DATABASE_URL
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        throw new Error("DATABASE_URL not found in environment");
      }
      
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      
      try {
        // Execute raw SQL to delete duplicates
        const result = await client.query(
          `DELETE FROM product_review_image WHERE id = ANY($1::text[])`,
          [imageIds]
        );
        
        console.log(`✓ Successfully deleted ${result.rowCount} duplicate images`);
        
        return new StepResponse({ deleted: result.rowCount }, imageIds);
      } finally {
        await client.end();
      }
    } catch (error: any) {
      console.error('Step deletion error:', error.message);
      
      // Don't throw - just log and continue
      console.log('⚠️ Auto-deletion failed, but review was saved successfully');
      return new StepResponse({ deleted: 0, error: error.message }, []);
    }
  },
  async (imageIds, { container }) => {
    // Compensation function - no need to restore since duplicates are unwanted
    console.log('Compensation: Duplicate cleanup rollback (no action needed)');
  }
);
