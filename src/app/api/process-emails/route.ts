import { NextRequest, NextResponse } from 'next/server';
import { loadEmails, buildThreads } from '@/lib/email-processor';

export async function POST(req: NextRequest) {
  try {
    // Load and process emails
    const emails = await loadEmails('emails.csv');
    const threads = buildThreads(emails);
    
    // Convert threads to string format
    const threadStrings = threads.map((thread) => {
      return thread.messages
        .map((msg) => `${msg.sender}: ${msg.message}`)
        .join('\n');
    });

    // Create initial dataset
    const datasetResponse = await fetch(new URL('/api/dataset', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(threadStrings),
    });
    const { id: datasetId } = await datasetResponse.json();

    // Create labels
    const questionLabels = [
      {
        label: 'HAS_UNANSWERED_QUESTION',
        description: 'The conversation ends with an unanswered question.',
      },
      {
        label: 'NO_UNANSWERED_QUESTION',
        description: 'The conversation does not end with an unanswered question.',
      },
    ];

    const topicLabels = [
      {
        label: 'MEDICAL_INSURANCE',
        description: 'The conversation is about medical insurance.',
      },
      {
        label: 'DENTAL_INSURANCE',
        description: 'The conversation is about dental insurance.',
      },
      {
        label: 'VISION_INSURANCE',
        description: 'The conversation is about vision insurance.',
      },
      {
        label: 'OTHER',
        description: 'The conversation is about another topic.',
      },
    ];

    // Add label sets
    const [questionLabelSetResponse, topicLabelSetResponse] = await Promise.all([
      fetch(new URL(`/api/dataset/${datasetId}/labels`, req.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionLabels),
      }),
      fetch(new URL(`/api/dataset/${datasetId}/labels`, req.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicLabels),
      }),
    ]);

    const { id: questionLabelSetId } = await questionLabelSetResponse.json();
    const { id: topicLabelSetId } = await topicLabelSetResponse.json();

    return NextResponse.json({
      success: true,
      datasetId,
      questionLabelSetId,
      topicLabelSetId,
    });
  } catch (error) {
    console.error('Error processing emails:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}
