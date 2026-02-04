import { NextResponse } from "next/server";
import { sdkServer } from "@/lib/sdk/sdk-server";

/**
 * GET /api/customer-orders
 * Get all orders for the authenticated customer with items that can be reviewed
 */
export async function GET() {
  try {
    // Get authenticated customer
    const customer = await sdkServer.store.customer.retrieve();
    
    if (!customer?.customer) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get customer's orders with items
    const { orders } = await sdkServer.store.order.list({
      fields: "*items,*items.product_id,*items.variant_id,*items.thumbnail,*items.title,*items.variant_title",
      limit: 1000,
    });

    // Get all existing reviews and filter by customer name
    let existingReviews: any[] = [];
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || 'http://localhost:9000';
      const reviewsRes = await fetch(
        `${backendUrl}/store/product-reviews?offset=0&limit=1000`,
        {
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '',
          },
        }
      );
      
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const allReviews = reviewsData.product_reviews || [];
        
        // Filter reviews by customer name (since email isn't returned by API)
        const customerFullName = `${customer.customer.first_name} ${customer.customer.last_name}`;
        
        existingReviews = allReviews.filter(
          (review: any) => review.name === customerFullName
        );
      }
    } catch (err) {
      console.error('[Customer Orders API] Error fetching reviews:', err);
    }

    // Create a set of product IDs that have been reviewed by this customer
    const reviewedProductIds = new Set(
      existingReviews.map((review: any) => review.product_id).filter(Boolean)
    );

    // Transform orders to include reviewable items
    // Only include ONE item per product (the most recent purchase)
    const productItemMap = new Map<string, any>();
    
    // Process orders from newest to oldest to get most recent purchase
    const sortedOrders = [...orders].sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sortedOrders.forEach((order: any) => {
      if (order.status === 'canceled') return;
      
      order.items?.forEach((item: any) => {
        const productId = item.product_id;
        
        // Skip if we already have an item for this product
        if (productItemMap.has(productId)) return;
        
        // Skip if product has been reviewed
        if (reviewedProductIds.has(productId)) return;
        
        // Add this item (most recent unreviewable purchase of this product)
        productItemMap.set(productId, {
          orderId: order.id,
          orderDisplayId: order.display_id,
          orderDate: order.created_at,
          item: {
            id: item.id,
            product_id: productId,
            variant_id: item.variant_id,
            title: item.title,
            variant_title: item.variant_title,
            thumbnail: item.thumbnail,
            hasReview: false,
          }
        });
      });
    });

    const reviewableItems = Array.from(productItemMap.values());

    return NextResponse.json({ 
      reviewableItems,
      totalOrders: orders.length,
      totalReviews: existingReviews.length
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
