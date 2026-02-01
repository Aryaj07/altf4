import { revalidate } from 'lib/medusa';
import { NextRequest, NextResponse } from 'next/server';

// Updated for webhook fix`nexport const runtime = 'edge';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return revalidate(req);
}
