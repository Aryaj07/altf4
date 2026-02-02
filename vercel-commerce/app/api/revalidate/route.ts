import { revalidate } from 'lib/medusa';
import { NextRequest, NextResponse } from 'next/server';

// Updated for webhook fix
export const runtime = 'edge';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return revalidate(req);
}
