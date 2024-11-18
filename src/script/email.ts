import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Email, EmailThread } from '@/lib/types';

async function loadEmails(filePath: string): Promise<Email[]> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
}

function buildThreads(emails: Email[]): EmailThread[] {
  const threads: Map<string, EmailThread> = new Map();
  const emailMap: Map<string, Email> = new Map();
  
  // First, create a map of all emails by their ID
  emails.forEach((email) => {
    emailMap.set(email.id, email);
  });

  // Then, process each email to build threads
  emails.forEach((email) => {
    if (!email.replyToId) {
      // This is the start of a new thread
      if (!threads.has(email.id)) {
        threads.set(email.id, { messages: [email] });
      }
    } else {
      // This is a reply, find the root of the thread
      let currentEmail = email;
      let threadRoot = currentEmail.replyToId;
      
      while (true) {
        const parentEmail = emailMap.get(threadRoot!);
        if (!parentEmail || !parentEmail.replyToId) {
          break;
        }
        threadRoot = parentEmail.replyToId;
      }

      // Add to existing thread or create new one
      const thread = threads.get(threadRoot!) || { messages: [] };
      thread.messages.push(email);
      threads.set(threadRoot!, thread);
    }
  });

  return Array.from(threads.values());
}

async function main() {
  // 1. Load and process emails
  const emails = await loadEmails('emails.csv');
  console.log("🚀 ~ main ~ emails:", emails)
  const threads = buildThreads(emails);
  console.log("🚀 ~ main ~ threads:", threads)
  
  // Convert threads to string format for the dataset
  const threadStrings = threads.map((thread) => {
    return thread.messages
    .map((msg) => `${msg.sender}: ${msg.message}`)
    .join('\n');
  });
  
  // 2. Create dataset
  const datasetResponse = await fetch('http://localhost:3000/api/dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(threadStrings),
  });
  const { id: datasetId } = await datasetResponse.json();

  // 3. Create labels for unanswered questions
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

  const questionLabelsResponse = await fetch(
    `http://localhost:3000/api/dataset/${datasetId}/labels`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionLabels),
    }
  );
  const { id: questionLabelSetId } = await questionLabelsResponse.json();

  // 4. Create labels for insurance topics
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

  const topicLabelsResponse = await fetch(
    `http://localhost:3000/api/dataset/${datasetId}/labels`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topicLabels),
    }
  );
  const { id: topicLabelSetId } = await topicLabelsResponse.json();

  // 5. Filter and create new dataset with relevant threads
  const unansweredResponse = await fetch(
    `http://localhost:3000/api/dataset/${datasetId}/labels/${questionLabelSetId}?label=HAS_UNANSWERED_QUESTION`
  );
  const unansweredData = await unansweredResponse.json();
  console.log("🚀 ~ main ~ unansweredData:", unansweredData)

  const dentalResponse = await fetch(
    `http://localhost:3000/api/dataset/${datasetId}/labels/${topicLabelSetId}?label=DENTAL_INSURANCE`
  );
  const dentalData = await dentalResponse.json();
  console.log("🚀 ~ main ~ dentalData:", dentalData)

  const visionResponse = await fetch(
    `http://localhost:3000/api/dataset/${datasetId}/labels/${topicLabelSetId}?label=VISION_INSURANCE`
  );
  const visionData = await visionResponse.json();
  console.log("🚀 ~ main ~ visionData:", visionData)

  // Combine and deduplicate relevant threads
  const relevantThreads = new Set([
    ...unansweredData.data.filter(
      (thread: string) =>
        dentalData.data.includes(thread) || visionData.data.includes(thread)
    ),
  ]);
  console.log("🚀 ~ main ~ relevantThreads:", relevantThreads)

  // Create final filtered dataset
  const finalDatasetResponse = await fetch('http://localhost:3000/api/dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Array.from(relevantThreads)),
  });
  const { id: finalDatasetId } = await finalDatasetResponse.json();

  console.log('Processing complete. Final dataset ID:', finalDatasetId);
}

main().catch(console.error);