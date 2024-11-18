import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Email, EmailThread } from '@/lib/types';
import path from 'path';

export async function loadEmails(filePath: string): Promise<Email[]> {
  const absolutePath = path.join(process.cwd(), filePath);
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
}

export function buildThreads(emails: Email[]): EmailThread[] {
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
