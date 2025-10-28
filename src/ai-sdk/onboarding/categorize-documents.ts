"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const documentCategorySchema = z.object({
  categories: z.array(
    z.object({
      fileName: z.string(),
      category: z.enum([
        "Contract",
        "Evidence",
        "Correspondence",
        "Court Filing",
        "Legal Brief",
        "Medical Records",
        "Financial Documents",
        "Witness Statement",
        "Other",
      ]),
      confidence: z.number().min(0).max(1),
    })
  ),
});

export async function categorizeDocuments(
  documents: Array<{ name: string; content: string }>
) {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: documentCategorySchema,
      prompt: `You are a legal document categorization assistant. Analyze the following documents and categorize each one into the most appropriate category.

Documents to categorize:
${documents
  .map(
    (doc, idx) => `
Document ${idx + 1}: ${doc.name}
Content preview: ${doc.content.slice(0, 500)}...
`
  )
  .join("\n")}

Return a categorization for each document with a confidence score (0-1).`,
    });

    return object.categories;
  } catch (error) {
    console.error("Error categorizing documents:", error);
    throw new Error("Failed to categorize documents");
  }
}
