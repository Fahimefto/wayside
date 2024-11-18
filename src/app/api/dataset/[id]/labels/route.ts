import { NextRequest, NextResponse } from 'next/server';
import { createLabelSet, getLabelSetsByDatasetId, getDataset } from '@/lib/db';
import { generateLabels } from '@/lib/openai';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const slug = (await params)
  try {
    const dataset = await getDataset(slug.id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const labels = await req.json();
    if (!Array.isArray(labels)) {
      return NextResponse.json({ error: 'Invalid labels format' }, { status: 400 });
    }

    // const results = await Promise.all(
    //   dataset.data.map((text) => generateLabels(text, labels))
    // );

    const labelSetId = await createLabelSet(slug.id, labels);
    return NextResponse.json({ id: labelSetId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }

) {
  const slug = (await params)
  try {
    const labelSetIds = await getLabelSetsByDatasetId(slug.id);
    return NextResponse.json({ ids: labelSetIds });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

//OK