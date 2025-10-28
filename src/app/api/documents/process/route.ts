import { NextRequest, NextResponse } from "next/server";
import { extractCaseDetails } from "@/ai-sdk/onboarding/extract-case-details";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Read file contents and convert to base64
    const documents = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");
        return {
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        };
      })
    );

    // Process all documents and extract details with categorization
    const processedDocuments = await Promise.all(
      documents.map(async (document) => {
        const extractedData = await extractCaseDetails(document);
        return {
          fileName: document.name,
          category: extractedData.documentCategory,
          categoryRationale: extractedData.categoryRationale,
          extractedData,
        };
      })
    );

    // Use the first document's extracted data as the primary case details
    // and create categories array from all processed documents
    const caseDetails = processedDocuments[0].extractedData;
    const categories = processedDocuments.map(doc => ({
      fileName: doc.fileName,
      category: doc.category,
      confidence: 1.0, // Since AI categorization doesn't provide confidence scores
      rationale: doc.categoryRationale,
    }));

    return NextResponse.json({
      categories,
      caseDetails,
      message: "Documents processed successfully",
    });
  } catch (error) {
    console.error("Error processing documents:", error);
    return NextResponse.json(
      { error: "Failed to process documents" },
      { status: 500 }
    );
  }
}
