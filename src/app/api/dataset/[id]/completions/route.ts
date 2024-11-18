import { NextRequest, NextResponse } from "next/server";
import { getDataset, getDatasetCompletions } from "@/lib/db";
import { toBase64 } from "@/lib/common";
import { getDocument } from "pdfjs-dist";
import { generateNextMessageFromImage } from "@/lib/openai";

// const getPdfText = async (url: string) => {
//   const pdf = await getDocument(url).promise;
//   const parts: string[] = [];

//   for (let i = 0; i < pdf.numPages; i++) {
//     console.log(`Getting page ${i + 1} of ${pdf.numPages}`);
//     const page = await pdf.getPage(i + 1);
//     const part = await page.getTextContent();
//     parts.push(
//       ...part.items
//         .map((item) => ("str" in item ? item.str : ""))
//         .map((s) => (s === "" ? " " : s))
//     );
//   }

//   console.log(
//     "Done getting text",
//     parts.length,
//     "parts",
//     parts.reduce((a, b) => a + b.length, 0),
//     "characters"
//   );

//   return { text: parts.join(" "), urls: [] as string[] };
// };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const slug = await params;
  try {
    const dataset = await getDataset(slug.id);
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }
    const completions = await getDatasetCompletions(slug.id);
    return NextResponse.json(completions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const slug = await params;
  try {
    const formData = await req.formData();
    const file = formData.get("png");
    console.log("🚀 ~ file:", file);
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided or invalid file type" },
        {
          status: 400,
        }
      );
    }
    const dataset = await getDataset(slug.id);
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const url = URL.createObjectURL(file);
    // const { text } = await getPdfText(url);

    // const res = generateNextMessageFromImage(dataset.data, text);

    return NextResponse.json({ message: "WIP" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
