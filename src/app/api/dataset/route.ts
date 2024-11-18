import { NextRequest, NextResponse } from 'next/server';
import { createDataset, getAllDatasetIds } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const id = await createDataset(data);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ids = await getAllDatasetIds();
    return NextResponse.json({ ids });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

//OK