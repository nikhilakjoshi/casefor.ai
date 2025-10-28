"use server";

import { generateObject } from "ai";
// import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { google } from "@ai-sdk/google";

const extractedFieldSchema = z.object({
  fieldName: z.string(),
  fieldValue: z.string(),
  label: z.string(),
});

const extractedInfoSchema = z.object({
  caseTitle: z
    .string()
    .describe(
      "Required case title (max 50 characters) that includes person's name and relevant details like occupation or degree"
    ),
  documentCategory: z
    .enum([
      "Identity",
      "Immigration", 
      "Evidence",
      "Affidavits",
      "Employment",
      "Education",
      "Contracts",
      "Financials",
      "Notices",
      "Court Docs",
      "Org Proof",
      "Forms",
      "Compliance",
      "US Benefit"
    ])
    .describe(
      "Category that best describes this document based on its content and purpose in legal/immigration context"
    ),
  categoryRationale: z
    .string()
    .describe(
      "Brief 1-2 sentence explanation for why this document fits the chosen category"
    ),
  extractedFields: z.array(extractedFieldSchema),
});

interface DocumentFile {
  name: string;
  mimeType: string;
  data: string; // base64 encoded file data
}

export async function extractCaseDetails(document: DocumentFile) {
  try {
    // Determine the content type based on MIME type
    const isImage = document.mimeType.startsWith("image/");
    const isPDF = document.mimeType === "application/pdf";
    const isDocx =
      document.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isXlsx =
      document.mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // Build the content parts using proper AI SDK format
    const contentParts: Array<
      | { type: "text"; text: string }
      | { type: "image"; image: string; mediaType?: string }
      | { type: "file"; data: string; mediaType: string }
    > = [
      {
        type: "text" as const,
        text: "Please analyze this document and extract all relevant information:",
      },
    ];

    // For images - use image type
    if (isImage) {
      contentParts.push({
        type: "image" as const,
        image: `data:${document.mimeType};base64,${document.data}`,
        mediaType: document.mimeType,
      });
    }
    // For PDFs - use file type with proper data URL format
    else if (isPDF) {
      contentParts.push({
        type: "file" as const,
        data: `data:${document.mimeType};base64,${document.data}`,
        mediaType: document.mimeType,
      });
    }
    // For other document types (DOCX, XLSX) - fallback to text extraction for now
    else if (isDocx || isXlsx) {
      // Note: These formats need special parsing libraries to extract text properly
      // For now, we'll skip them and return an error message
      throw new Error(`File type ${document.mimeType} is not yet supported. Please use PDF or image files.`);
    } else {
      // Fallback: for other file types, try as text
      // This will decode base64 to text
      const decodedText = Buffer.from(document.data, "base64").toString(
        "utf-8"
      );
      contentParts.push({
        type: "text" as const,
        text: `Document content:\n${decodedText}`,
      });
    }

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: extractedInfoSchema,
      system: `You are a document analysis assistant. Extract as much structured information as possible from the provided document.

IMPORTANT: You must generate a caseTitle that is:
- Maximum 50 characters long
- Includes the person's name if available
- Includes relevant identifying information like occupation, degree, or case type
- Examples: "John Smith - Contract Dispute", "Dr. Jane Doe - Medical License", "ABC Corp - Tax Assessment"

DOCUMENT CATEGORIZATION: Choose the most appropriate category from these options:
- Identity: Passport, Driver's License, Birth Certificate, SSN Card
- Immigration: I-140, I-485, I-797s, Visa Stamps, EAD
- Evidence: Awards, Patents, Publications, Media Features
- Affidavits: Expert Opinion Letters, Witness Statements
- Employment: Offer Letters, Org Charts, Pay Stubs, Tax Docs
- Education: Degrees, Transcripts, Certifications
- Contracts: Employment Agreement, NDA, IP Assignment
- Financials: Salary Benchmarks, Bank Statements, W-2s
- Notices: USCIS Notices, RFEs, Lawyer Letters
- Court Docs: Judgments, Pleadings, Arbitration Orders
- Org Proof: Annual Reports, Press Releases, Awards
- Forms: Intake Forms, Cover Letters, G-28
- Compliance: KYC, AML Proof, Licenses, Audit Docs
- US Benefit: Market Impact Letters, Economic Data

Provide a brief rationale (1-2 sentences) explaining why the document fits the chosen category.

For the extractedFields array, extract every piece of information you can identify in this format:
- fieldName: A technical name for the field (camelCase, like "firstName", "phoneNumber", "defendantName", etc.)
- fieldValue: The actual extracted value from the document
- label: A user-friendly display name for the field (like "First Name", "Phone Number", "Defendant Name", etc.)

Extract ALL available information including but not limited to:
- Personal information (names, addresses, phone numbers, emails)
- Case details (numbers, types, dates, parties)
- Financial information (amounts, values, costs)
- Legal entities (attorneys, courts, jurisdictions)
- Important dates and deadlines
- Professional information (occupations, degrees, licenses)
- Any other relevant data present in the document

Be thorough and extract every piece of meaningful information you can find.`,
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
    });

    return object;
  } catch (error) {
    console.error("Error extracting case details:", error);
    throw new Error("Failed to extract case details");
  }
}
