# Enhanced Upload Media Widget

## Overview

This admin widget provides an enhanced file upload component for Medusa products with an **increased file size limit of 50MB** (up from the default 1MB).

## File Location

`src/admin/widgets/enhanced-upload-media-widget.tsx`

## Features

- ✅ **50MB file size limit** (increased from 1MB default)
- ✅ Drag and drop support
- ✅ Multiple file uploads
- ✅ Real-time file preview
- ✅ File validation (format and size)
- ✅ Visual feedback for errors
- ✅ Remove uploaded files before submission
- ✅ Display file size in MB

## Supported Formats

- JPEG (.jpeg, .jpg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- HEIC (.heic)
- SVG (.svg)

## Widget Configuration

The widget is configured to appear in the product details page using:

```typescript
zone: "product.details.after"
```

This places the widget after the main product details section.

## Key Changes from Original Component

### File Size Limit
```typescript
// Original: 1MB (default)
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024

// Enhanced: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024
```

### Error Messages
Updated error messages to reflect the new 50MB limit:
```typescript
message: `Files too large: ${fileNames}. Maximum file size is 50MB.`
```

## Usage

The widget is automatically loaded by Medusa's admin dashboard. Once deployed, it will appear on product detail pages after the main product information section.

### File Upload Process

1. **Select Files**: User can either:
   - Click on the upload area to browse files
   - Drag and drop files onto the upload area

2. **Validation**: Files are validated for:
   - Supported format (JPEG, PNG, GIF, WebP, HEIC, SVG)
   - Size limit (50MB max per file)

3. **Preview**: Valid files are:
   - Added to the upload preview
   - Shown with thumbnail, name, and size
   - Can be removed before final submission

4. **Save**: Click the "Save X Image(s)" button to:
   - Upload files to Medusa backend
   - Add images to the current product
   - Automatically refresh the page to show new images

5. **Error Handling**: Invalid files trigger error messages:
   - Format errors show unsupported file types
   - Size errors show which files exceed 50MB
   - Upload/save errors display detailed messages

## Integration with Medusa

This widget integrates with Medusa's admin SDK and API:

### Admin SDK
```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk"
```

### UI Components
- `Container` - Layout wrapper
- `Heading` - Section title
- `Text` - Typography
- `Button` - Action button for saving
- `toast` - Notification system
- `clx` - Utility for conditional classes
- Icons from `@medusajs/icons`

### API Integration

The widget makes two API calls to save images:

1. **Upload Files** (`POST /admin/uploads`)
   ```typescript
   const formData = new FormData()
   uploadedFiles.forEach((fileData) => {
     formData.append("files", fileData.file)
   })
   
   fetch("/admin/uploads", {
     method: "POST",
     body: formData,
     credentials: "include",
   })
   ```

2. **Update Product** (`POST /admin/products/{id}`)
   ```typescript
   fetch(`/admin/products/${data.id}`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       images: allImageUrls.map((url) => ({ url })),
     }),
     credentials: "include",
   })
   ```

### Widget Props

The widget receives the current product data:

```typescript
const EnhancedUploadMediaWidget = ({ data }: { data: AdminProduct }) => {
  // data contains the current product information
  // including existing images
}
```

## Technical Details

### Component Structure

1. **FileUpload Component**: Base upload component with drag-drop
2. **EnhancedUploadMediaWidget**: Main widget with file management
3. **Config Export**: Widget zone configuration

### State Management

```typescript
const [uploadedFiles, setUploadedFiles] = useState<FileType[]>([])
const [error, setError] = useState<string | null>(null)
const [isSaving, setIsSaving] = useState(false)
```

### Save Flow

1. User selects files → Files added to `uploadedFiles` state
2. User clicks "Save X Image(s)" button
3. Widget uploads files to `/admin/uploads` endpoint
4. Widget receives file URLs from upload response
5. Widget merges new URLs with existing product images
6. Widget updates product via `/admin/products/{id}` endpoint
7. Success toast displayed
8. Page reloads to show updated product images

### File Validation

```typescript
const hasInvalidFiles = useCallback(
  (fileList: FileType[] = [], rejectedFiles: RejectedFile[] = []) => {
    // Check file format
    // Check file size
    // Set appropriate error messages
  },
  []
)
```

## Customization

To modify the file size limit, update:

```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024 // Change to desired size in bytes
```

To add more supported formats:

```typescript
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  // Add more MIME types here
]

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  // Add corresponding extensions here
]
```

## Future Enhancements

Potential improvements:
- Upload progress indicator
- Integration with Medusa's file upload workflow
- Batch upload to backend
- Image optimization before upload
- More file format support (videos, documents)

## Based On

This widget is based on the Medusa admin dashboard component:
`packages/admin/dashboard/src/routes/products/common/components/upload-media-form-item/upload-media-form-item.tsx`

Reference commit: `842c0f500721e08d448b6c5c80a725072106ccff`
