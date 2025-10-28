"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCaseNote, updateCaseNote, deleteCaseNote } from "@/actions/case";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Edit, Trash2, Save, X, Bot } from "lucide-react";

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

export function CaseStrategyPanel({ notes, strategies, caseId }: CaseStrategyPanelProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState({ title: "", content: "" });
  const [isPending, startTransition] = useTransition();
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
    try {
      // TODO: Implement AI strategy generation
      console.log("Generating AI strategy for case:", caseId);
      
      // TODO: Call AI service and refresh strategies list
    } catch (error) {
      console.error("Failed to generate strategy:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Strategy</CardTitle>
        <CardDescription>
          AI-generated strategies and manual notes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Manual Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Notes</h4>
              <Button
                onClick={() => setIsAddingNote(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {/* Add Note Form */}
            {isAddingNote && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="note-title">Title (Optional)</Label>
                      <Input
                        id="note-title"
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        placeholder="Note title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="note-content">Content</Label>
                      <Textarea
                        id="note-content"
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        placeholder="Write your note here..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddNote} disabled={!newNote.content.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Note
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsAddingNote(false);
                        setNewNote({ title: "", content: "" });
                      }}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes List */}
            {notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-muted rounded-lg">
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingNote.title}
                          onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                          placeholder="Note title..."
                        />
                        <Textarea
                          value={editingNote.content}
                          onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(note.id)}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          {note.title && <h5 className="font-medium">{note.title}</h5>}
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditNote(note)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(note.createdAt).toLocaleDateString()}
                          {note.createdAt !== note.updatedAt && " (edited)"}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes added yet.</p>
            )}
          </div>
          
          {/* AI Strategies Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">AI-Generated Strategies</h4>
              <Button
                onClick={generateStrategy}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                Generate Strategy
              </Button>
            </div>

            {strategies && strategies.length > 0 ? (
              <div className="space-y-3">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{strategy.title}</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{strategy.version}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {strategy.aiModel}
                        </Badge>
                      </div>
                    </div>
                    {strategy.summary && (
                      <p className="text-sm text-muted-foreground mb-2">{strategy.summary}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{strategy.content}</p>
                    {strategy.generationReason && (
                      <p className="text-xs text-blue-700 mt-2 italic">
                        Generated because: {strategy.generationReason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Generated: {new Date(strategy.createdAt).toLocaleDateString()}
                      {strategy.generatedBy && ` by ${strategy.generatedBy}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No strategies generated yet.</p>
                <p className="text-xs text-muted-foreground">Click "Generate Strategy" to create an AI-powered case strategy.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}