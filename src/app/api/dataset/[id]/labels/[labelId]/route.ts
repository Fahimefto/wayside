import { NextRequest, NextResponse } from 'next/server';
import { getLabelSet, getDataset } from '@/lib/db';
import { generateLabels } from '@/lib/openai';
import { Label } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string,labelId: string }> }

) {
  try {
    const slug = (await params)
    const labelSet =  await getLabelSet(slug.labelId);
    if (!labelSet) {
      return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
    }
    
    const dataset = await getDataset(slug.id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const searchParams = new URL(req.url).searchParams;
    const filterLabel = searchParams.get('label');
    const results = await Promise.all(
      dataset.data.map((text) => generateLabels(text, labelSet.labels))
    );

    if (filterLabel) {
      const filteredIndices = results
        .map((result, index) => (result.label === filterLabel ? index : -1))
        .filter((index) => index !== -1);

      const filteredData = filteredIndices.map((index) => dataset.data[index]);
      return NextResponse.json({
        ...labelSet,
        data: filteredData,
        results: filteredIndices.map((index) => results[index]),
      });
    }

    return NextResponse.json({labelSet,results});
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

//OK