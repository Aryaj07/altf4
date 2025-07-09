'use server';

import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { TAGS } from 'lib/constants';

export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Medusa,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = ['categories/create', 'categories/delete', 'categories/update'];
  const productWebhooks = ['products/create', 'products/delete', 'products/update'];
  const topic = headers().get('x-medusa-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.MEDUSA_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 200 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.categories);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

export async function getCartCookie() {
  return cookies().get('cartId')?.value;
}

export async function setCartCookie(cartId: string) {
  cookies().set('cartId', cartId, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true
  });
}
