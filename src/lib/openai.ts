import OpenAI from "openai";
import { Label, LabelResult } from "./types";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export const generateLabels = async (
  text: string,
  labels: Label[]
): Promise<LabelResult> => {
  const prompt = `
  Given the following conversation:

  ${text}

  And the following possible labels:
  ${labels.map((l) => `${l.label}: ${l.description}`).join("\n")}

Please select the most appropriate label and provide a reason for your choice.
Respond in the following JSON format:
{
  "label": "SELECTED_LABEL",
  "reason": "Your reasoning here"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  return JSON.parse(content);
};

export const generateNextMessageFromImage = async (
  text: string[],
  base64Image: string
): Promise<string> => {
  const prompt = `
  Given the following conversation:
  ${text.join("\n")}

  
  Please generate the next message in the conversation using the provided image.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: "data:image/png;base64," + base64Image,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  return JSON.parse(content);
};
