"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCaseNote,
  updateCaseNote,
  deleteCaseNote,
  generateCaseStrategy,
  updateStrategyManually,
  uploadDocumentsToCase,
} from "@/actions/case";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, AlertCircle, Edit, FileDown, History } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { ScrollArea } from "./ui/scroll-area";
import dynamic from "next/dynamic";
import { markdownToHtmlSync } from "@/lib/content-converter";
import { generatePdfFromHtml } from "@/lib/pdf-generator";
import dayjs from "dayjs";
import { StrategyHistoryModal } from "./strategy-history-modal";

const ConfigurableSimpleEditor = dynamic(
  () =>
    import("@/components/configurable-simple-editor").then(
      (mod) => mod.ConfigurableSimpleEditor
    ),
  { ssr: false }
);

interface CaseNote {
  id: string;
  title?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

interface CaseStrategy {
  id: string;
  version: number;
  title: string;
  content: string;
  summary?: string | null;
  aiModel: string;
  generationReason?: string | null;
  createdAt: string;
  generatedBy?: string | null;
  strategy_metadata?: {
    contentType?: string;
    [key: string]: unknown;
  } | null;
}

interface CaseStrategyPanelProps {
  notes: CaseNote[];
  strategies: CaseStrategy[];
  caseId: string;
}

export function CaseStrategyPanel({
  notes,
  strategies,
  caseId,
}: CaseStrategyPanelProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState({ title: "", content: "" });
  const [, startTransition] = useTransition();
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [editedStrategyContent, setEditedStrategyContent] = useState("");
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const router = useRouter();

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return;

    startTransition(async () => {
      try {
        const result = await createCaseNote({
          caseId,
          title: newNote.title.trim() || undefined,
          content: newNote.content.trim(),
        });

        if (result.success) {
          setNewNote({ title: "", content: "" });
          setIsAddingNote(false);
          router.refresh(); // Refresh to show new note
        } else {
          console.error("Failed to create note:", result.error);
        }
      } catch (error) {
        console.error("Failed to create note:", error);
      }
    });
  };

  const handleEditNote = (note: CaseNote) => {
    setEditingNoteId(note.id);
    setEditingNote({ title: note.title || "", content: note.content });
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editingNote.content.trim()) return;

    startTransition(async () => {
      try {
        const result = await updateCaseNote({
          noteId,
          title: editingNote.title.trim() || undefined,
          content: editingNote.content.trim(),
        });

        if (result.success) {
          setEditingNoteId(null);
          setEditingNote({ title: "", content: "" });
          router.refresh(); // Refresh to show updated note
        } else {
          console.error("Failed to update note:", result.error);
        }
      } catch (error) {
        console.error("Failed to update note:", error);
      }
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    startTransition(async () => {
      try {
        const result = await deleteCaseNote(noteId);

        if (result.success) {
          router.refresh(); // Refresh to remove deleted note
        } else {
          console.error("Failed to delete note:", result.error);
        }
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNote({ title: "", content: "" });
  };

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    setStrategyError(null);

    try {
      const result = await generateCaseStrategy({
        caseId,
        reason: "Manual strategy generation requested by user",
      });

      if (result.success) {
        router.refresh(); // Refresh to show new strategy
      } else {
        setStrategyError(result.error || "Failed to generate strategy");
      }
    } catch (error) {
      console.error("Failed to generate strategy:", error);
      setStrategyError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const retryStrategyGeneration = () => {
    setStrategyError(null);
    generateStrategy();
  };

  const handleEditStrategy = (strategy: CaseStrategy) => {
    // If content is already HTML, use it directly; otherwise convert from Markdown
    const htmlContent =
      strategy.strategy_metadata?.contentType === "html"
        ? strategy.content
        : markdownToHtmlSync(strategy.content);

    setEditedStrategyContent(htmlContent);
    setIsEditingStrategy(true);
  };

  const handleCancelEditStrategy = () => {
    setIsEditingStrategy(false);
    setEditedStrategyContent("");
  };

  const handleSaveStrategy = async () => {
    if (!editedStrategyContent.trim()) return;

    const latestStrategy = strategies[0];
    if (!latestStrategy) return;

    setIsSavingStrategy(true);

    try {
      const result = await updateStrategyManually({
        caseId,
        content: editedStrategyContent,
        previousVersion: latestStrategy.version,
        isHtml: true, // Mark as HTML content from TipTap editor
      });

      if (result.success) {
        setIsEditingStrategy(false);
        setEditedStrategyContent("");
        router.refresh();
      } else {
        console.error("Failed to save strategy:", result.error);
        alert("Failed to save strategy: " + result.error);
      }
    } catch (error) {
      console.error("Failed to save strategy:", error);
      alert("Failed to save strategy");
    } finally {
      setIsSavingStrategy(false);
    }
  };

  const handleExportToPdf = async () => {
    const latestStrategy = strategies[0];
    if (!latestStrategy) return;

    setIsExportingPdf(true);

    try {
      let htmlContent: string;

      if (isEditingStrategy) {
        // Use the currently edited content
        htmlContent = editedStrategyContent;
      } else {
        // Check if content is already HTML or needs conversion from Markdown
        htmlContent =
          latestStrategy.strategy_metadata?.contentType === "html"
            ? latestStrategy.content
            : markdownToHtmlSync(latestStrategy.content);
      }

      const pdfBlob = await generatePdfFromHtml(
        htmlContent,
        latestStrategy.title
      );
      const file = new File(
        [pdfBlob],
        `${latestStrategy.title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
        { type: "application/pdf" }
      );

      const result = await uploadDocumentsToCase({
        caseId,
        files: [file],
        categories: [
          {
            fileName: file.name,
            category: "Strategy Document",
            confidence: 1.0,
            rationale: "Strategy exported as PDF from case strategy panel",
          },
        ],
      });

      if (result.success) {
        alert("Strategy exported to case documents successfully!");
        router.refresh();
      } else {
        alert("Failed to export strategy: " + result.error);
      }
    } catch (error) {
      console.error("Failed to export strategy:", error);
      alert("Failed to export strategy as PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <ScrollArea className="" overrideTableDisplay>
      <Card className="border-none shadow-none max-h-[70vh]">
        <CardHeader>
          <CardTitle className="flex items-center">
            Case Strategy
            <div className="flex items-center justify-between ml-auto gap-2">
              <div className="flex items-center gap-2">
                {strategyError && (
                  <Button
                    onClick={retryStrategyGeneration}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Retry
                  </Button>
                )}
                {strategies && strategies.length > 1 && (
                  <Button
                    onClick={() => setShowHistoryModal(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </Button>
                )}
                <Button
                  onClick={generateStrategy}
                  size="sm"
                  variant="outline"
                  disabled={isGeneratingStrategy || isEditingStrategy}
                  className="flex items-center gap-2"
                >
                  {isGeneratingStrategy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  {isGeneratingStrategy
                    ? "Generating..."
                    : strategies && strategies.length > 0
                    ? "Regenerate Strategy"
                    : "Generate Strategy"}
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* AI Strategies Section */}
            <div>
              {/* Strategy Generation Error */}
              {strategyError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Strategy Generation Failed
                    </span>
                  </div>
                  <p className="text-sm text-red-700">{strategyError}</p>
                </div>
              )}

              {/* Loading Overlay */}
              {isGeneratingStrategy && (
                <div className="relative">
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-lg border">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">
                        Generating strategy...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {strategies && strategies.length > 0 ? (
                <div className="space-y-3">
                  {/* Show only the latest strategy */}
                  {(() => {
                    const strategy = strategies[0];
                    return (
                      <div key={strategy.id} className="px-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{strategy.title}</h5>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">v{strategy.version}</Badge>
                            {!isEditingStrategy && (
                              <>
                                <Button
                                  onClick={() => handleEditStrategy(strategy)}
                                  size="sm"
                                  variant="ghost"
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={handleExportToPdf}
                                  size="sm"
                                  variant="ghost"
                                  disabled={isExportingPdf}
                                  className="flex items-center gap-1"
                                >
                                  {isExportingPdf ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <FileDown className="h-3 w-3" />
                                  )}
                                  Add to Documents
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {strategy.summary && !isEditingStrategy && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {strategy.summary}
                          </p>
                        )}

                        {isEditingStrategy ? (
                          <div className="markdown-body">
                            <ConfigurableSimpleEditor
                              content={editedStrategyContent}
                              onUpdate={(content: string) =>
                                setEditedStrategyContent(content)
                              }
                              placeholder="Edit your strategy..."
                              showActions={true}
                              onCancel={handleCancelEditStrategy}
                              onSave={handleSaveStrategy}
                              onExport={handleExportToPdf}
                              isSaving={isSavingStrategy}
                              isExporting={isExportingPdf}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-sm prose prose-sm max-w-none markdown-body">
                              {/* Check if content is HTML or Markdown based on metadata */}
                              {strategy.strategy_metadata?.contentType ===
                              "html" ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: strategy.content,
                                  }}
                                />
                              ) : (
                                <Markdown>{strategy.content}</Markdown>
                              )}
                            </div>
                            {strategy.generationReason && (
                              <p className="text-xs text-blue-700 mt-2 italic">
                                Generated because: {strategy.generationReason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Generated:{" "}
                              {dayjs(strategy.createdAt).format("MM/DD/YYYY")}
                              {strategy.generatedBy &&
                                ` by ${strategy.generatedBy}`}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No strategies generated yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Generate Strategy&quot; to create an AI-powered
                    case strategy.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <StrategyHistoryModal
        strategies={strategies}
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
      />
    </ScrollArea>
  );
}
