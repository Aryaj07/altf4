import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button, Input, Textarea, Select } from "@medusajs/ui";
import { useState, useEffect } from "react";
import { PencilSquare, Trash, Plus } from "@medusajs/icons";

type DescriptionSection = {
  id: string;
  product_id: string;
  title?: string;
  content?: string;
  image_url?: string;
  template: "image_left_text_right" | "image_right_text_left" | "full_width_image";
  order: number;
  metadata?: any;
};

const ProductDescriptionWidget = ({ data }: any) => {
  const productId = data?.id;
  const [sections, setSections] = useState<DescriptionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<DescriptionSection | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/admin/product-description-sections?product_id=${productId}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchSections();
    }
  }, [productId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      await fetch(`/admin/product-description-sections/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Failed to delete section");
    }
  };

  const handleEdit = (section: DescriptionSection) => {
    setEditingSection(section);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingSection(null);
    setShowForm(true);
  };

  const getTemplateName = (template: string) => {
    switch (template) {
      case "image_left_text_right":
        return "Image Left / Text Right";
      case "image_right_text_left":
        return "Image Right / Text Left";
      case "full_width_image":
        return "Full Width Image";
      default:
        return template;
    }
  };

  if (loading) {
    return (
      <Container className="p-8">
        <Heading level="h2">Product Description Sections</Heading>
        <p className="text-ui-fg-subtle mt-2">Loading...</p>
      </Container>
    );
  }

  return (
    <Container className="p-8">
      <div className="flex justify-between items-center mb-6">
        <Heading level="h2">Product Description Sections</Heading>
        <Button variant="secondary" onClick={handleAddNew}>
          <Plus /> Add Section
        </Button>
      </div>

      {sections.length === 0 && !showForm && (
        <div className="text-ui-fg-subtle p-8 text-center border border-dashed rounded">
          <p>No description sections yet.</p>
          <p className="text-sm mt-2">
            Click "Add Section" to create rich product descriptions with images.
          </p>
        </div>
      )}

      {showForm && (
        <SectionForm
          productId={productId}
          section={editingSection}
          onClose={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
          onSave={() => {
            fetchSections();
            setShowForm(false);
            setEditingSection(null);
          }}
        />
      )}

      <div className="space-y-4 mt-4">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div
              key={section.id}
              className="border rounded-lg p-4 hover:bg-ui-bg-subtle transition"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs bg-ui-bg-subtle px-2 py-1 rounded whitespace-nowrap">
                      Order: {section.order}
                    </span>
                    <span className="text-xs bg-ui-bg-subtle px-2 py-1 rounded whitespace-nowrap">
                      {getTemplateName(section.template)}
                    </span>
                  </div>
                  {section.title && (
                    <h3 className="font-semibold mb-2 text-base">{section.title}</h3>
                  )}
                  {section.content && (
                    <div className="text-sm text-ui-fg-subtle mb-3">
                      <p className="line-clamp-3">
                        {section.content.replace(/<[^>]*>/g, "").substring(0, 200)}
                        {section.content.replace(/<[^>]*>/g, "").length > 200 ? "..." : ""}
                      </p>
                    </div>
                  )}
                  {section.image_url && (
                    <div className="mt-3 p-2 bg-ui-bg-subtle rounded">
                      <p className="text-xs text-ui-fg-muted font-medium mb-2">Image:</p>
                      <div className="flex items-center gap-2">
                        <img 
                          src={section.image_url} 
                          alt={section.title || "Section image"}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <p className="text-xs text-ui-fg-muted break-all">
                          {section.image_url.length > 60 
                            ? section.image_url.substring(0, 60) + "..." 
                            : section.image_url}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => handleEdit(section)}
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => handleDelete(section.id)}
                  >
                    <Trash className="text-ui-fg-error" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </Container>
  );
};

const SectionForm = ({ productId, section, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    title: section?.title || "",
    content: section?.content || "",
    image_url: section?.image_url || "",
    template: section?.template || "image_left_text_right",
    order: section?.order || 0,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      alert('Image size must be less than 30MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch('/admin/uploads', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Handle different response formats
      let imageUrl = null;
      
      if (data.uploads && data.uploads.length > 0) {
        imageUrl = data.uploads[0].url;
      } else if (data.files && data.files.length > 0) {
        imageUrl = data.files[0].url;
      } else if (typeof data.url === 'string') {
        imageUrl = data.url;
      }

      if (imageUrl) {
        // Check if URL already has full domain (from Medusa file service)
        if (imageUrl.startsWith('http')) {
          // Already a complete URL, use as-is
          setFormData(prev => ({ ...prev, image_url: imageUrl }));
        } else {
          // Relative URL - construct full URL
          const filename = imageUrl.replace(/^\//, ''); // Remove leading slash
          const baseUrl = window.location.origin; // Use current admin domain
          const correctUrl = `${baseUrl}/static/${filename}`;
          setFormData(prev => ({ ...prev, image_url: correctUrl }));
        }
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = section
        ? `/admin/product-description-sections/${section.id}`
        : `/admin/product-description-sections`;

      const payload = section 
        ? formData  // For updates, don't send product_id again
        : { product_id: productId, ...formData }; // For creates, include product_id

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save section");
      }

      onSave();
    } catch (error) {
      console.error("Error saving section:", error);
      alert(`Failed to save section: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 mb-4 bg-ui-bg-base">
      <h3 className="font-semibold mb-4">
        {section ? "Edit Section" : "Add New Section"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Template</label>
          <Select
            value={formData.template}
            onValueChange={(value) =>
              setFormData({ ...formData, template: value as any })
            }
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="image_left_text_right">
                Image Left / Text Right
              </Select.Item>
              <Select.Item value="image_right_text_left">
                Image Right / Text Left
              </Select.Item>
              <Select.Item value="full_width_image">
                Full Width Image
              </Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., G75 Series"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Content (HTML supported)
          </label>
          <Textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="<p>Description text here...</p>"
            rows={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image</label>
          
          {/* Image Preview */}
          {formData.image_url && (
            <div className="mb-3 relative">
              <img
                src={formData.image_url}
                alt="Preview"
                className="max-h-48 w-auto object-contain border rounded p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => setFormData({ ...formData, image_url: "" })}
                className="mt-2"
              >
                <Trash className="text-ui-fg-error" /> Remove Image
              </Button>
            </div>
          )}
          
          {/* Upload Button */}
          {!formData.image_url && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="description-image-upload"
              />
              <label htmlFor="description-image-upload">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploadingImage}
                  onClick={() => document.getElementById('description-image-upload')?.click()}
                >
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                </Button>
              </label>
              <p className="text-xs text-ui-fg-subtle mt-2">
                JPG, PNG, GIF, or WebP. Max 30MB.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Order (for sorting)
          </label>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
            }
            placeholder="0"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Section"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductDescriptionWidget;
