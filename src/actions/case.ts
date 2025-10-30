"use server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const ExtractedFieldSchema = z.object({
  fieldName: z.string(),
  fieldValue: z.string(),
  label: z.string(),
});

const DocumentCategorySchema = z.object({
  fileName: z.string(),
  category: z.string(),
  confidence: z.number(),
  rationale: z.string(),
});

const CreateCaseSchema = z.object({
  caseTitle: z.string().min(1).max(50),
  documentCategory: z.string(),
  categoryRationale: z.string(),
  extractedFields: z.array(ExtractedFieldSchema),
  categories: z.array(DocumentCategorySchema),
  assignedToId: z.string().optional(),
});

const UploadDocumentsToCaseSchema = z.object({
  caseId: z.string(),
  files: z.array(z.instanceof(File)),
  categories: z.array(DocumentCategorySchema),
});

type CreateCaseInput = z.infer<typeof CreateCaseSchema>;
type UploadDocumentsToCaseInput = z.infer<typeof UploadDocumentsToCaseSchema>;

interface CreateCaseResult {
  success: boolean;
  data?: {
    caseId: string;
    clientId: string;
  };
  error?: string;
}

interface UploadDocumentsToCaseResult {
  success: boolean;
  data?: {
    documentIds: string[];
    uploadResults: Array<{
      success: boolean;
      fileName: string;
      documentId?: string;
      category?: string;
      chunksCreated?: number;
      warning?: string;
      error?: string;
    }>;
  };
  error?: string;
}

export async function createNewCase(input: CreateCaseInput): Promise<CreateCaseResult> {
  try {
    // Validate input
    const validatedInput = CreateCaseSchema.parse(input);

    // Extract client information from extracted fields
    const clientInfo = extractClientInfo(validatedInput.extractedFields);
    
    // Generate unique case number
    const caseNumber = await generateCaseNumber();

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create client
      const client = await tx.client.create({
        data: {
          name: clientInfo.name || "Unknown Client",
          email: clientInfo.email,
          phone: clientInfo.phone,
          address: clientInfo.address,
          client_metadata: {
            extractedFields: validatedInput.extractedFields,
            source: "ai_extraction",
            extractedAt: new Date().toISOString(),
          },
        },
      });

      // Create case
      const case_ = await tx.case.create({
        data: {
          title: validatedInput.caseTitle,
          caseNumber,
          description: `Case created from AI document analysis. Primary document category: ${validatedInput.documentCategory}`,
          clientId: client.id,
          assignedToId: validatedInput.assignedToId,
          case_metadata: {
            aiExtraction: {
              documentCategory: validatedInput.documentCategory,
              categoryRationale: validatedInput.categoryRationale,
              extractedFields: validatedInput.extractedFields,
              categories: validatedInput.categories,
              extractedAt: new Date().toISOString(),
            },
          },
        },
      });

      return {
        caseId: case_.id,
        clientId: client.id,
      };
    });

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error("Error creating case:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function uploadDocumentsToCase(input: UploadDocumentsToCaseInput): Promise<UploadDocumentsToCaseResult> {
  try {
    // Validate input
    const validatedInput = UploadDocumentsToCaseSchema.parse(input);
    const { caseId, files, categories } = validatedInput;

    // Import required modules
    const { uploadFileToS3 } = await import("@/lib/s3");
    const { extractCaseDetails } = await import("@/ai-sdk/onboarding/extract-case-details");

    const uploadResults = [];
    const documentIds = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const category = categories[i];

      try {
        // First, create document record to get document ID
        const document = await prisma.document.create({
          data: {
            title: category?.fileName || file.name,
            description: `Document categorized as: ${category?.category}. ${category?.rationale}`,
            fileName: file.name,
            fileUrl: "", // Will be updated after S3 upload
            fileSize: file.size,
            mimeType: file.type,
            category: category?.category,
            categoryRationale: category?.rationale,
            caseId: caseId,
            document_metadata: {
              aiAnalysis: {
                category: category?.category,
                rationale: category?.rationale,
                confidence: category?.confidence,
                extractedAt: new Date().toISOString(),
              },
              uploadStatus: "pending",
            },
          },
        });

        documentIds.push(document.id);

        // Upload file to backend with proper case ID and document ID
        const uploadResult = await uploadFileToS3(file, caseId, document.id);
        
        if (!uploadResult.success) {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }

        // Convert file to base64 for local AI processing
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // Extract document details using local AI (for UI categorization)
        const documentData = {
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        };

        const extractionResult = await extractCaseDetails(documentData);

        // Update document record with S3 URLs and backend metadata
        await prisma.document.update({
          where: { id: document.id },
          data: {
            fileUrl: uploadResult.fileUrl!,
            s3Bucket: uploadResult.bucket,
            s3Key: uploadResult.key,
            document_metadata: {
              aiAnalysis: {
                category: category?.category || extractionResult.documentCategory,
                rationale: category?.rationale || extractionResult.categoryRationale,
                confidence: category?.confidence || 1.0,
                extractedFields: extractionResult.extractedFields,
                extractedAt: new Date().toISOString(),
              },
              s3Info: {
                bucket: uploadResult.bucket,
                key: uploadResult.key,
                uploadedAt: new Date().toISOString(),
              },
              backendProcessing: {
                chunksCreated: uploadResult.chunksCreated,
                documentsProcessed: uploadResult.documentsProcessed,
                warning: uploadResult.warning,
                processedAt: new Date().toISOString(),
              },
              uploadStatus: "completed",
            },
          },
        });

        uploadResults.push({
          success: true,
          fileName: file.name,
          documentId: document.id,
          category: category?.category || extractionResult.documentCategory,
          chunksCreated: uploadResult.chunksCreated,
          warning: uploadResult.warning,
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        
        // Update document status to failed if it was created
        if (documentIds.length > uploadResults.length) {
          const documentId = documentIds[documentIds.length - 1];
          await prisma.document.update({
            where: { id: documentId },
            data: {
              document_metadata: {
                uploadStatus: "failed",
                error: fileError instanceof Error ? fileError.message : "Unknown error",
              },
            },
          });
        }

        uploadResults.push({
          success: false,
          fileName: file.name,
          error: fileError instanceof Error ? fileError.message : "Unknown error",
        });
      }
    }

    // Auto-generate strategy after successful document uploads
    const successfulUploads = uploadResults.filter(result => result.success);
    if (successfulUploads.length > 0) {
      try {
        // Generate strategy in background (don't block the upload response)
        const { generateCaseStrategy: generateStrategy } = await import("@/ai-sdk/agents/strategyManager");
        
        generateStrategy({
          caseId,
          reason: `Auto-generated after uploading ${successfulUploads.length} new document(s): ${successfulUploads.map(r => r.fileName).join(", ")}`,
        }).catch(error => {
          console.error("Background strategy generation failed:", error);
        });
      } catch (error) {
        console.error("Failed to trigger background strategy generation:", error);
      }
    }

    return {
      success: true,
      data: {
        documentIds,
        uploadResults,
      },
    };
  } catch (error) {
    console.error("Error uploading documents to case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Helper function to extract client information from extracted fields
function extractClientInfo(extractedFields: Array<{ fieldName: string; fieldValue: string; label: string }>) {
  const clientInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  } = {};

  extractedFields.forEach(field => {
    const fieldName = field.fieldName.toLowerCase();
    
    if (fieldName.includes("name") || fieldName.includes("client")) {
      clientInfo.name = field.fieldValue;
    } else if (fieldName.includes("email")) {
      clientInfo.email = field.fieldValue;
    } else if (fieldName.includes("phone") || fieldName.includes("mobile") || fieldName.includes("tel")) {
      clientInfo.phone = field.fieldValue;
    } else if (fieldName.includes("address") || fieldName.includes("location")) {
      clientInfo.address = field.fieldValue;
    }
  });

  return clientInfo;
}

// Helper function to generate unique case number
async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CASE-${year}-`;
  
  // Get the latest case number for this year
  const latestCase = await prisma.case.findFirst({
    where: {
      caseNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      caseNumber: "desc",
    },
  });

  let nextNumber = 1;
  if (latestCase) {
    const currentNumber = parseInt(latestCase.caseNumber.replace(prefix, ""));
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

// Helper function to get case by ID with related data
export async function getCaseById(caseId: string) {
  try {
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        documents: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
        strategies: {
          orderBy: { version: "desc" },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: case_,
    };
  } catch (error) {
    console.error("Error fetching case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Helper function to get all cases for sidebar
export async function getAllCases() {
  try {
    const cases = await prisma.case.findMany({
      select: {
        id: true,
        title: true,
        caseNumber: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: cases,
    };
  } catch (error) {
    console.error("Error fetching cases:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// CRUD operations for case notes
export async function createCaseNote(data: {
  caseId: string;
  title?: string;
  content: string;
  createdBy?: string;
}) {
  try {
    const note = await prisma.caseNote.create({
      data: {
        caseId: data.caseId,
        title: data.title,
        content: data.content,
        createdBy: data.createdBy,
      },
    });

    return {
      success: true,
      data: note,
    };
  } catch (error) {
    console.error("Error creating note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateCaseNote(data: {
  noteId: string;
  title?: string;
  content: string;
  updatedBy?: string;
}) {
  try {
    const note = await prisma.caseNote.update({
      where: { id: data.noteId },
      data: {
        title: data.title,
        content: data.content,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: note,
    };
  } catch (error) {
    console.error("Error updating note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteCaseNote(noteId: string) {
  try {
    await prisma.caseNote.delete({
      where: { id: noteId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update client information
export async function updateClient(data: {
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  updatedBy?: string;
}) {
  try {
    const client = await prisma.client.update({
      where: { id: data.clientId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: client,
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Generate case strategy using AI
export async function generateCaseStrategy(data: {
  caseId: string;
  reason?: string;
}) {
  try {
    const { generateCaseStrategy: generateStrategy } = await import("@/ai-sdk/agents/strategyManager");
    
    const result = await generateStrategy({
      caseId: data.caseId,
      reason: data.reason || "Manual strategy generation requested",
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to generate strategy",
      };
    }

    return {
      success: true,
      message: "Strategy generated successfully",
    };
  } catch (error) {
    console.error("Error generating case strategy:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Upload and process documents with AI extraction + backend integration
export async function uploadDocuments(data: {
  caseId: string;
  files: File[];
}) {
  try {
    // Import required modules
    const { uploadFileToS3 } = await import("@/lib/s3");
    const { extractCaseDetails } = await import("@/ai-sdk/onboarding/extract-case-details");

    const results = [];

    for (const file of data.files) {
      try {
        // Upload file to backend (handles S3 + Pinecone chunking)
        const uploadResult = await uploadFileToS3(file, data.caseId);
        if (!uploadResult.success) {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }

        // Convert file to base64 for local AI processing
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // Extract document details using local AI (for UI categorization)
        const documentData = {
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        };

        const extractionResult = await extractCaseDetails(documentData);

        // Create document record in database with backend metadata
        const document = await prisma.document.create({
          data: {
            title: extractionResult.caseTitle || file.name,
            description: `Document categorized as: ${extractionResult.documentCategory}. ${extractionResult.categoryRationale}`,
            fileName: file.name,
            fileUrl: uploadResult.fileUrl!,
            fileSize: file.size,
            mimeType: file.type,
            s3Bucket: uploadResult.bucket,
            s3Key: uploadResult.key,
            category: extractionResult.documentCategory,
            categoryRationale: extractionResult.categoryRationale,
            caseId: data.caseId,
            document_metadata: {
              aiAnalysis: {
                category: extractionResult.documentCategory,
                rationale: extractionResult.categoryRationale,
                extractedFields: extractionResult.extractedFields,
                extractedAt: new Date().toISOString(),
              },
              s3Info: {
                bucket: uploadResult.bucket,
                key: uploadResult.key,
                uploadedAt: new Date().toISOString(),
              },
              backendProcessing: {
                chunksCreated: uploadResult.chunksCreated,
                documentsProcessed: uploadResult.documentsProcessed,
                warning: uploadResult.warning,
                processedAt: new Date().toISOString(),
              },
            },
          },
        });

        results.push({
          success: true,
          fileName: file.name,
          documentId: document.id,
          category: extractionResult.documentCategory,
          chunksCreated: uploadResult.chunksCreated,
          warning: uploadResult.warning,
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        results.push({
          success: false,
          fileName: file.name,
          error: fileError instanceof Error ? fileError.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Error uploading documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}