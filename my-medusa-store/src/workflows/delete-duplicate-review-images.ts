import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { deleteDuplicateReviewImagesStep } from "./steps/delete-duplicate-review-images";

type WorkflowInput = {
  imageIds: string[];
};

export const deleteDuplicateReviewImagesWorkflow = createWorkflow(
  "delete-duplicate-review-images-workflow",
  (input: WorkflowInput) => {
    const result = deleteDuplicateReviewImagesStep(input.imageIds);
    
    return new WorkflowResponse(result);
  }
);
