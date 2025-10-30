import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { generateText } from "ai";

const prisma = new PrismaClient();

// Input schema for the agent
const strategyManagerInputSchema = z.object({
  caseId: z.string().describe("The case ID to generate strategy for"),
  clientId: z.string().optional().describe("Optional client ID"),
  reason: z
    .string()
    .optional()
    .describe("Reason for generating/updating strategy"),
});

// Strategy manager agent
export const strategyManagerAgent = new Agent({
  model: anthropic("claude-sonnet-4-0"),
  tools: {
    getCurrentStrategy: tool({
      description: "Get the current/latest strategy for a case",
      inputSchema: z.object({
        caseId: z.string().describe("The case ID to get strategy for"),
      }),
      execute: async ({ caseId }) => {
        try {
          const latestStrategy = await prisma.caseStrategy.findFirst({
            where: { caseId },
            orderBy: { version: "desc" },
            include: {
              case: {
                include: {
                  client: true,
                },
              },
            },
          });

          return {
            success: true,
            strategy: latestStrategy,
            hasStrategy: !!latestStrategy,
          };
        } catch (error) {
          console.error("Error getting current strategy:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    getAllDocumentContent: tool({
      description:
        "Get text content and metadata from all uploaded documents for a case",
      inputSchema: z.object({
        caseId: z.string().describe("The case ID to get documents for"),
        caseDocumentId: z
          .string()
          .optional()
          .describe("Optional specific document ID to filter"),
      }),
      execute: async ({ caseId, caseDocumentId }) => {
        try {
          // Import the backend API function
          const { getDocumentsForCase } = await import("@/lib/backend-api");

          // Get documents from backend API
          const backendResult = await getDocumentsForCase(
            caseId,
            caseDocumentId
          );

          if (!backendResult.success) {
            // Fallback to database-only metadata if backend fails
            console.warn(
              "Backend API failed, using database metadata only:",
              backendResult.error
            );

            const documents = await prisma.document.findMany({
              where: {
                caseId,
                ...(caseDocumentId && { id: caseDocumentId }),
              },
              select: {
                id: true,
                title: true,
                fileName: true,
                category: true,
                categoryRationale: true,
                description: true,
                mimeType: true,
                fileSize: true,
                createdAt: true,
                document_metadata: true,
              },
            });

            const fallbackDocuments = documents.map((doc) => ({
              id: doc.id,
              title: doc.title,
              fileName: doc.fileName,
              category: doc.category,
              categoryRationale: doc.categoryRationale,
              description: doc.description,
              mimeType: doc.mimeType,
              fileSize: doc.fileSize,
              createdAt: doc.createdAt,
              metadata: doc.document_metadata,
              textContent: `[CONTENT UNAVAILABLE] Backend API failed. Document: ${doc.fileName}, Category: ${doc.category}, Description: ${doc.description}`,
              chunkCount: 0,
              uploadTimestamp: doc.createdAt,
            }));

            return {
              success: true,
              documents: fallbackDocuments,
              totalDocuments: fallbackDocuments.length,
              markdownContent: fallbackDocuments
                .map(
                  (doc) =>
                    `# ${doc.fileName}\n\n[Content unavailable - backend API error]\n\nCategory: ${doc.category}\nDescription: ${doc.description}`
                )
                .join("\n\n---\n\n"),
              warning: "Document content unavailable due to backend API error",
            };
          }

          const backendData = backendResult.data!;

          // Get additional metadata from database
          const dbDocuments = await prisma.document.findMany({
            where: { caseId },
            select: {
              id: true,
              title: true,
              fileName: true,
              category: true,
              categoryRationale: true,
              description: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
              document_metadata: true,
            },
          });

          // Merge backend content with database metadata
          const enrichedDocuments = backendData.documents.map((backendDoc) => {
            const dbDoc = dbDocuments.find(
              (d) => d.fileName === backendDoc.filename
            );

            return {
              id:
                dbDoc?.id ||
                backendDoc.case_document_id ||
                `backend-${backendDoc.filename}`,
              title: dbDoc?.title || backendDoc.filename,
              fileName: backendDoc.filename,
              category: dbDoc?.category,
              categoryRationale: dbDoc?.categoryRationale,
              description: dbDoc?.description,
              mimeType: dbDoc?.mimeType,
              fileSize: dbDoc?.fileSize,
              createdAt: dbDoc?.createdAt || backendDoc.upload_timestamp,
              metadata: dbDoc?.document_metadata,
              // Real content from backend
              textContent: backendDoc.content,
              chunkCount: backendDoc.chunk_count,
              uploadTimestamp: backendDoc.upload_timestamp,
              caseId: backendDoc.case_id,
              caseDocumentId: backendDoc.case_document_id,
            };
          });

          return {
            success: true,
            documents: enrichedDocuments,
            totalDocuments: backendData.total_documents,
            markdownContent: backendData.markdown_content,
            caseId: backendData.case_id,
            caseDocumentId: backendData.case_document_id,
          };
        } catch (error) {
          console.error("Error getting document content:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    updateOrCreateStrategy: tool({
      description:
        "Create or update a case strategy using document content, current strategy, and system prompt",
      inputSchema: z.object({
        caseId: z.string().describe("The case ID"),
        documents: z
          .array(z.any())
          .describe("Array of document content and metadata"),
        currentStrategy: z
          .any()
          .optional()
          .describe("Current strategy if exists"),
        reason: z
          .string()
          .optional()
          .describe("Reason for generating this strategy"),
      }),
      execute: async ({ caseId, documents, currentStrategy, reason }) => {
        try {
          // Read the system prompt
          const systemPromptPath = join(
            process.cwd(),
            "src",
            "system_prompts",
            "strategy.prompt.md"
          );
          const systemPrompt = await readFile(systemPromptPath, "utf-8");

          // Get case and client information
          const caseInfo = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
              client: true,
            },
          });

          if (!caseInfo) {
            throw new Error("Case not found");
          }

          // Prepare context for strategy generation
          const documentSummaries = documents.map((doc: any) => ({
            title: doc.title,
            category: doc.category,
            summary: doc.extractedData?.summary || doc.description,
            keyPoints: doc.extractedData?.keyPoints || [],
          }));

          const strategyContext = {
            case: {
              title: caseInfo.title,
              description: caseInfo.description,
              type: caseInfo.type,
              status: caseInfo.status,
            },
            client: {
              name: caseInfo.client.name,
              email: caseInfo.client.email,
            },
            documents: documentSummaries,
            currentStrategy: currentStrategy
              ? {
                  content: currentStrategy.content,
                  summary: currentStrategy.summary,
                  version: currentStrategy.version,
                }
              : null,
            reason: reason || "Strategy generation requested",
          };

          // Generate strategy using Claude
          const { text: generatedStrategy } = await generateText({
            model: anthropic("claude-sonnet-4-0"),
            system: systemPrompt,
            prompt: `Generate a comprehensive legal strategy for this case:

Case Information:
${JSON.stringify(strategyContext, null, 2)}

Please provide a detailed strategy that includes:
1. Executive Summary
2. Legal Analysis
3. Recommended Actions
4. Timeline and Milestones
5. Risk Assessment
6. Success Metrics

Format your response as a well-structured strategy document.`,
          });

          // Extract summary (first paragraph or first 200 chars)
          const strategySummary =
            generatedStrategy.split("\n")[0].substring(0, 200) + "...";

          // Get next version number
          const lastStrategy = await prisma.caseStrategy.findFirst({
            where: { caseId },
            orderBy: { version: "desc" },
          });
          const nextVersion = (lastStrategy?.version || 0) + 1;

          // Save strategy to database
          const newStrategy = await prisma.caseStrategy.create({
            data: {
              caseId,
              version: nextVersion,
              title: `Strategy v${nextVersion} - ${caseInfo.title}`,
              content: generatedStrategy,
              summary: strategySummary,
              generationReason: reason || "Strategy generation requested",
              strategy_metadata: {
                documentsAnalyzed: documents.length,
                generationContext: strategyContext,
                aiModel: "claude-sonnet-4-0",
                generatedAt: new Date().toISOString(),
              },
            },
          });

          return {
            success: true,
            strategy: newStrategy,
            isNewVersion: true,
            version: nextVersion,
          };
        } catch (error) {
          console.error("Error creating/updating strategy:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),
  },
  stopWhen: stepCountIs(10),
});

// Main function to generate strategy for a case
export async function generateCaseStrategy(
  input: z.infer<typeof strategyManagerInputSchema>
) {
  try {
    const validatedInput = strategyManagerInputSchema.parse(input);

    const result = await strategyManagerAgent.generate({
      prompt: `Generate a comprehensive legal strategy for case ${
        validatedInput.caseId
      }. 
      
      Please:
      1. First get the current strategy (if any)
      2. Get all document content and metadata for analysis
      3. Create or update the strategy based on all available information
      
      ${
        validatedInput.reason
          ? `Reason for this generation: ${validatedInput.reason}`
          : ""
      }`,
    });

    return {
      success: true,
      result: result.text,
      steps: result.steps,
    };
  } catch (error) {
    console.error("Error in strategy generation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
