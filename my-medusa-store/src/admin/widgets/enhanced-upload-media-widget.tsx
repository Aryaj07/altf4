import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { ArrowDownTray } from "@medusajs/icons"
import { Text, clx, Container, Heading, Button, toast } from "@medusajs/ui"
import { ChangeEvent, DragEvent, useRef, useState, useCallback } from "react"
import { AdminProduct, AdminProductImage } from "@medusajs/framework/types"

// Types
export interface FileType {
  id: string
  url: string
  file: File
}

export interface RejectedFile {
  file: File
  reason: "size" | "format"
}

export interface FileUploadProps {
  label: string
  multiple?: boolean
  hint?: string
  hasError?: boolean
  formats: string[]
  maxFileSize?: number
  onUploaded: (files: FileType[], rejectedFiles?: RejectedFile[]) => void
}

// Supported formats
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
]

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".svg",
]

// Increased max file size to 50MB (changed from 1MB default)
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// FileUpload Component
export const FileUpload = ({
  label,
  hint,
  multiple = true,
  hasError,
  formats,
  maxFileSize = MAX_FILE_SIZE,
  onUploaded,
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLButtonElement>(null)

  const handleOpenFileSelector = () => {
    inputRef.current?.click()
  }

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const files = event.dataTransfer?.files
    if (!files) {
      return
    }

    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (
      !dropZoneRef.current ||
      dropZoneRef.current.contains(event.relatedTarget as Node)
    ) {
      return
    }

    setIsDragOver(false)
  }

  const handleUploaded = (files: FileList | null) => {
    if (!files) {
      return
    }

    const fileList = Array.from(files)
    const validFiles: FileType[] = []
    const rejectedFiles: RejectedFile[] = []
    const normalizedMaxFileSize = Math.min(maxFileSize, Infinity)

    fileList.forEach((file) => {
      if (file.size > normalizedMaxFileSize) {
        rejectedFiles.push({ file, reason: "size" })
        return
      }

      const id = Math.random().toString(36).substring(7)
      const previewUrl = URL.createObjectURL(file)
      validFiles.push({
        id: id,
        url: previewUrl,
        file,
      })
    })

    onUploaded(validFiles, rejectedFiles)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragOver(false)

    handleUploaded(event.dataTransfer?.files)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    handleUploaded(event.target.files)
  }

  return (
    <div>
      <button
        ref={dropZoneRef}
        type="button"
        onClick={handleOpenFileSelector}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={clx(
          "bg-ui-bg-component border-ui-border-strong transition-fg group flex w-full flex-col items-center gap-y-2 rounded-lg border border-dashed p-8",
          "hover:border-ui-border-interactive focus:border-ui-border-interactive",
          "focus:shadow-borders-focus outline-none focus:border-solid",
          {
            "!border-ui-border-error": hasError,
            "!border-ui-border-interactive": isDragOver,
          }
        )}
      >
        <div className="text-ui-fg-subtle group-disabled:text-ui-fg-disabled flex items-center gap-x-2">
          <ArrowDownTray />
          <Text>{label}</Text>
        </div>
        {!!hint && (
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-muted group-disabled:text-ui-fg-disabled"
          >
            {hint}
          </Text>
        )}
      </button>
      <input
        hidden
        ref={inputRef}
        onChange={handleFileChange}
        type="file"
        accept={formats.join(",")}
        multiple={multiple}
      />
    </div>
  )
}

// Main Upload Media Widget Component
const EnhancedUploadMediaWidget = ({ data }: { data: AdminProduct }) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const hasInvalidFiles = useCallback(
    (fileList: FileType[] = [], rejectedFiles: RejectedFile[] = []) => {
      const invalidFile = fileList.find(
        (f) => !SUPPORTED_FORMATS.includes(f?.file?.type)
      )

      if (invalidFile) {
        setError(
          `Invalid file type: ${invalidFile.file.name}. Supported types: ${SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", ")}`
        )
        return true
      }

      const fileSizeRejections = rejectedFiles.filter(
        (f) => f?.reason === "size"
      )

      if (fileSizeRejections.length) {
        const fileNames = fileSizeRejections
          .slice(0, 5)
          .map((f) => f.file.name)
          .join(", ")
        setError(
          `Files too large: ${fileNames}. Maximum file size is 50MB.`
        )
        return true
      }

      return false
    },
    []
  )

  const onUploaded = useCallback(
    (files: FileType[] = [], rejectedFiles: RejectedFile[] = []) => {
      setError(null)
      
      if (hasInvalidFiles(files, rejectedFiles)) {
        return
      }

      setUploadedFiles((prev) => [...prev, ...files])
    },
    [hasInvalidFiles]
  )

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSave = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("No files to upload", {
        description: "Please select files before saving",
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Step 1: Upload files to Medusa
      const formData = new FormData()
      uploadedFiles.forEach((fileData) => {
        formData.append("files", fileData.file)
      })

      const uploadResponse = await fetch("/admin/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload files")
      }

      const { files } = await uploadResponse.json()

      // Step 2: Update product with new images
      const existingImageUrls = data.images?.map((img: AdminProductImage) => img.url) || []
      const newImageUrls = files.map((file: { url: string }) => file.url)
      const allImageUrls = [...existingImageUrls, ...newImageUrls]

      const updateResponse = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: allImageUrls.map((url: string) => ({ url })),
        }),
        credentials: "include",
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update product")
      }

      toast.success("Images uploaded successfully", {
        description: `${files.length} image(s) added to product`,
      })

      // Clear uploaded files after successful save
      setUploadedFiles([])
      
      // Reload the page to show updated product
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      console.error("Error saving images:", err)
      setError("Failed to save images. Please try again.")
      toast.error("Failed to save images", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between p-6">
        <div className="flex flex-col gap-y-2">
          <Heading level="h2">Enhanced Media Upload (50MB Limit)</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Upload product images with increased file size limit
          </Text>
        </div>
        {uploadedFiles.length > 0 && (
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
            size="small"
            variant="primary"
          >
            Save {uploadedFiles.length} Image{uploadedFiles.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-y-4 p-6">
        <FileUpload
          label="Upload Images"
          hint="Upload images up to 50MB. Drag and drop or click to browse."
          hasError={!!error}
          formats={SUPPORTED_FORMATS}
          onUploaded={onUploaded}
          maxFileSize={MAX_FILE_SIZE}
          multiple={true}
        />
        
        {error && (
          <div className="text-ui-fg-error rounded-md border border-ui-border-error bg-ui-bg-error-subtle p-3">
            <Text size="small">{error}</Text>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">
              Uploaded Files ({uploadedFiles.length})
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="relative rounded-md border border-ui-border-base p-2"
                >
                  <img
                    src={file.url}
                    alt={file.file.name}
                    className="h-20 w-full rounded object-cover"
                  />
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-ui-fg-error hover:text-ui-fg-error-hover absolute right-1 top-1 rounded bg-white p-1 text-xs"
                  >
                    ✕
                  </button>
                  <Text size="xsmall" className="mt-1 truncate">
                    {file.file.name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

// Widget configuration - inject into product details page
export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default EnhancedUploadMediaWidget
