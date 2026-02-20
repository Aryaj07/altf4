import { NextResponse } from 'next/server';

const MEDUSA_API = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || '';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_VERCEL_URL || 'https://altf4gear.com';
const BRAND = process.env.COMPANY_NAME || 'Altf4';
const CURRENCY = 'INR';

async function medusaFetch(path: string) {
  const res = await fetch(`${MEDUSA_API}/store${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': PUBLISHABLE_KEY,
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  if (!res.ok) return null;
  return res.json();
}

function escapeXml(str: string): string {
  if (!str) return '';
  // Remove all XML-invalid control characters (0x00-0x1F except tab, newline, carriage return)
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAvailability(variant: any): string {
  const preorder = variant?.preorder_variant;
  const isPreorder = preorder?.status === 'enabled' &&
    preorder.available_date &&
    new Date(preorder.available_date) > new Date();

  if (isPreorder) return 'preorder';
  if (variant?.allow_backorder) return 'backorder';

  const qty = variant?.inventory_quantity;
  const manages = variant?.manage_inventory;
  if (manages === true) {
    return (typeof qty === 'number' && qty > 0) ? 'in_stock' : 'out_of_stock';
  }
  return 'in_stock'; // Not tracking inventory = available
}

function getPrice(variant: any): number {
  // Try calculated_price first (from region-aware queries)
  const cp = variant?.calculated_price;
  if (cp?.calculated_amount != null) return cp.calculated_amount;
  // Fall back to prices array
  const price = variant?.prices?.[0];
  if (price?.amount != null) return price.amount;
  return 0;
}

function getAvailabilityDate(variant: any): string | null {
  const preorder = variant?.preorder_variant;
  if (preorder?.status === 'enabled' && preorder.available_date) {
    const d = new Date(preorder.available_date);
    if (d > new Date()) {
      return d.toISOString().split('T')[0] + 'T00:00:00Z';
    }
  }
  return null;
}

export async function GET() {
  try {
    // Fetch region for pricing
    const regionData = await medusaFetch('/regions');
    const regionId = regionData?.regions?.[0]?.id;

    // Fetch all products with full variant data
    let path = '/products?limit=100&fields=+*variants.prices,+*variants.preorder_variant,+*variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder';
    if (regionId) path += `&region_id=${regionId}`;

    const productData = await medusaFetch(path);
    const products = productData?.products || [];

    // Fetch categories for product_type mapping
    const categoryData = await medusaFetch('/product-categories');
    const categories = categoryData?.product_categories || [];
    const categoryMap: Record<string, string> = {};
    for (const cat of categories) {
      categoryMap[cat.id] = cat.name;
    }

    // Build XML items - one per variant
    const items: string[] = [];

    for (const product of products) {
      // Skip draft/unpublished
      if (product.status && product.status !== 'published') continue;
      if (!product.variants?.length) continue;

      const productTitle = product.title || '';
      const productTitleSafe = escapeXml(productTitle);
      const productDesc = stripHtml(product.description || product.title || '');
      const productHandle = product.handle || '';
      const productLink = `${SITE_URL}/product/${productHandle}`;
      const productImage = product.thumbnail || product.images?.[0]?.url || '';

      // Additional images (up to 10)
      const additionalImages = (product.images || [])
        .map((img: any) => img.url)
        .filter((url: string) => url && url !== productImage)
        .slice(0, 10);

      // Product type from categories
      const productCategories = product.categories || [];
      const productType = productCategories
        .map((c: any) => categoryMap[c.id] || c.name)
        .filter(Boolean)
        .join(' > ') || 'Gaming Peripherals';

      // Google product category (Electronics > Gaming)
      const googleCategory = '222'; // Electronics > Video Game Accessories

      const hasMultipleVariants = product.variants.length > 1;

      for (const variant of product.variants) {
        const availability = getAvailability(variant);
        const price = getPrice(variant);
        if (price <= 0) continue; // Skip variants without price

        const variantId = variant.sku || variant.id;
        const variantTitleRaw = hasMultipleVariants && variant.title && variant.title !== 'Default'
          ? `${productTitle} - ${variant.title}`
          : productTitle;
        // Sanitize control chars for CDATA (no XML escaping needed inside CDATA)
        const variantTitle = variantTitleRaw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        const variantDesc = productDesc.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Extract option values (color, size, etc.)
        const options: Record<string, string> = {};
        if (variant.options) {
          for (const opt of variant.options) {
            const name = (opt.option?.title || '').toLowerCase();
            const value = opt.value || '';
            if (name && value) options[name] = value;
          }
        }

        // Use variant thumbnail if available, else product image
        const imageLink = variant.thumbnail || productImage;

        const availabilityDate = getAvailabilityDate(variant);

        // Build the item XML
        let itemXml = `    <item>
      <g:id>${escapeXml(variantId)}</g:id>
      <g:title><![CDATA[${variantTitle}]]></g:title>
      <g:description><![CDATA[${variantDesc}]]></g:description>
      <g:link>${escapeXml(productLink)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${CURRENCY}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(BRAND)}</g:brand>
      <g:product_type>${escapeXml(productType)}</g:product_type>
      <g:google_product_category>${googleCategory}</g:google_product_category>`;

        // Item group ID (groups variants of same product)
        if (hasMultipleVariants) {
          itemXml += `\n      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>`;
        }

        // Additional images
        for (const imgUrl of additionalImages) {
          itemXml += `\n      <g:additional_image_link>${escapeXml(imgUrl)}</g:additional_image_link>`;
        }

        // GTIN / MPN / Barcode
        if (variant.barcode || variant.ean || variant.upc) {
          itemXml += `\n      <g:gtin>${escapeXml(variant.barcode || variant.ean || variant.upc)}</g:gtin>`;
        } else if (variant.sku) {
          itemXml += `\n      <g:mpn>${escapeXml(variant.sku)}</g:mpn>`;
        } else {
          itemXml += `\n      <g:identifier_exists>false</g:identifier_exists>`;
        }

        // Variant options (color, size, material, etc.)
        if (options['color'] || options['colour']) {
          itemXml += `\n      <g:color>${escapeXml(options['color'] || options['colour']!)}</g:color>`;
        }
        if (options['size']) {
          itemXml += `\n      <g:size>${escapeXml(options['size'])}</g:size>`;
        }
        if (options['material']) {
          itemXml += `\n      <g:material>${escapeXml(options['material'])}</g:material>`;
        }
        // Map switches/layout etc. as custom labels for Google Ads campaigns
        let labelIdx = 0;
        for (const [key, val] of Object.entries(options)) {
          if (['color', 'colour', 'size', 'material'].includes(key)) continue;
          if (labelIdx >= 5) break;
          itemXml += `\n      <g:custom_label_${labelIdx}>${escapeXml(val)}</g:custom_label_${labelIdx}>`;
          labelIdx++;
        }

        // Preorder availability date
        if (availability === 'preorder' && availabilityDate) {
          itemXml += `\n      <g:availability_date>${availabilityDate}</g:availability_date>`;
        }

        // Weight for shipping calculations
        if (variant.weight) {
          itemXml += `\n      <g:shipping_weight>${variant.weight} g</g:shipping_weight>`;
        } else if (product.weight) {
          itemXml += `\n      <g:shipping_weight>${product.weight} g</g:shipping_weight>`;
        }

        // Shipping (free above 999 INR)
        if (price >= 999) {
          itemXml += `\n      <g:shipping>
        <g:country>IN</g:country>
        <g:price>0.00 ${CURRENCY}</g:price>
      </g:shipping>`;
        }

        itemXml += `\n    </item>`;
        items.push(itemXml);
      }
    }

    // Build full RSS XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(BRAND)} - Gaming Peripherals</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Premium gaming keyboards, mice, and accessories from ${escapeXml(BRAND)}</description>
${items.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error generating Google Merchant feed:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
