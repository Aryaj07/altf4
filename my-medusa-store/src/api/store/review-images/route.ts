import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * POST /store/review-images
 * Upload review images to /static/reviews directory
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        message: "No files uploaded. Please select image files." 
      });
    }

    // Validate file types
    const imageFiles = files.filter(file => file.mimetype.startsWith('image/'));

    if (imageFiles.length === 0) {
      return res.status(400).json({ 
        message: "No valid image files found. Please upload JPG, PNG, or GIF files." 
      });
    }

    // Limit to 4 images per review
    const filesToUpload = imageFiles.slice(0, 4);
    
    // Validate file sizes (5MB max each)
    const oversizedFiles = filesToUpload.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({ 
        message: `Some files are too large. Maximum size is 5MB per image.` 
      });
    }

    // Create /static/reviews directory if it doesn't exist
    const staticDir = path.join(process.cwd(), 'static');
    const reviewsDir = path.join(staticDir, 'reviews');
    
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    
    if (!fs.existsSync(reviewsDir)) {
      fs.mkdirSync(reviewsDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000';

    // Save each file
    for (const file of filesToUpload) {
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      const filename = `review-${timestamp}-${randomString}${ext}`;
      
      const filePath = path.join(reviewsDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      
      const imageUrl = `${backendUrl}/static/reviews/${filename}`;
      uploadedUrls.push(imageUrl);
    }
    
    res.json({ 
      success: true,
      images: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error) {
    console.error("Error uploading review images:", error);
    return res.status(500).json({ 
      message: "Failed to upload images",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
