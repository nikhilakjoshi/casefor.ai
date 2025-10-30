"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCaseNote,
  updateCaseNote,
  deleteCaseNote,
  generateCaseStrategy,
} from "@/actions/case";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, AlertCircle } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { ScrollArea } from "./ui/scroll-area";

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

  return (
    <ScrollArea className="max-w-fit" overrideTableDisplay>
      <Card className="border-none shadow-none max-h-[70vh] max-w-fit">
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
                <Button
                  onClick={generateStrategy}
                  size="sm"
                  variant="outline"
                  disabled={isGeneratingStrategy}
                  className="flex items-center gap-2"
                >
                  {isGeneratingStrategy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  {isGeneratingStrategy ? "Generating..." : "Generate Strategy"}
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
                  {strategies.map((strategy) => (
                    <div key={strategy.id} className="px-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{strategy.title}</h5>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{strategy.version}</Badge>
                          {/* <Badge variant="secondary" className="text-xs">
                            {strategy.aiModel}
                          </Badge> */}
                        </div>
                      </div>
                      {strategy.summary && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {strategy.summary}
                        </p>
                      )}
                      <div className="text-sm prose prose-sm max-w-none markdown-body">
                        <Markdown>{strategy.content}</Markdown>
                      </div>
                      {strategy.generationReason && (
                        <p className="text-xs text-blue-700 mt-2 italic">
                          Generated because: {strategy.generationReason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Generated:{" "}
                        {new Date(strategy.createdAt).toLocaleDateString()}
                        {strategy.generatedBy && ` by ${strategy.generatedBy}`}
                      </p>
                    </div>
                  ))}
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
    </ScrollArea>
  );
}
