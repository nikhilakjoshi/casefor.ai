"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileDown, Save, X, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { generatePdfFromHtml } from "@/lib/pdf-generator";
import { uploadDocumentsToCase } from "@/actions/case";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const ConfigurableSimpleEditor = dynamic(
  () => import("@/components/configurable-simple-editor").then((mod) => mod.ConfigurableSimpleEditor),
  { ssr: false }
);

interface CaseDocumentEditorPanelProps {
  caseId: string;
}

export function CaseDocumentEditorPanel({ caseId }: CaseDocumentEditorPanelProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleClear = () => {
    if (content.trim() && !confirm("Are you sure you want to clear the document? This action cannot be undone.")) {
      return;
    }
    setTitle("");
    setContent("");
  };

  const handleExportToPdf = async () => {
    if (!content.trim()) {
      alert("Please add some content before exporting");
      return;
    }

    if (!title.trim()) {
      alert("Please add a title before exporting");
      return;
    }

    setIsExporting(true);

    try {
      const pdfBlob = await generatePdfFromHtml(content, title);
      const filename = title.trim().replace(/[^a-z0-9]/gi, '_') || 'document';
      const file = new File(
        [pdfBlob],
        `${filename}.pdf`,
        { type: 'application/pdf' }
      );

      const result = await uploadDocumentsToCase({
        caseId,
        files: [file],
        categories: [{
          fileName: file.name,
          category: "User Created Document",
          confidence: 1.0,
          rationale: "Document created using the document editor",
        }],
      });

      if (result.success) {
        alert("Document added to case successfully!");
        router.refresh();
        // Optionally clear the editor after successful export
        if (confirm("Document exported successfully! Would you like to clear the editor?")) {
          setTitle("");
          setContent("");
        }
      } else {
        alert("Failed to add document: " + result.error);
      }
    } catch (error) {
      console.error("Failed to export document:", error);
      alert("Failed to export document as PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save to localStorage as draft
    const draft = {
      title,
      content,
      timestamp: dayjs().toISOString(),
    };
    localStorage.setItem(`case-document-draft-${caseId}`, JSON.stringify(draft));
    alert("Draft saved locally!");
  };

  const handleLoadDraft = () => {
    const draftJson = localStorage.getItem(`case-document-draft-${caseId}`);
    if (!draftJson) {
      alert("No draft found");
      return;
    }

    try {
      const draft = JSON.parse(draftJson);
      if (content.trim() && !confirm("Loading draft will replace current content. Continue?")) {
        return;
      }
      setTitle(draft.title || "");
      setContent(draft.content || "");
      alert(`Draft loaded from ${dayjs(draft.timestamp).format('MM/DD/YYYY h:mm A')}`);
    } catch (error) {
      console.error("Failed to load draft:", error);
      alert("Failed to load draft");
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Editor
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLoadDraft}
              size="sm"
              variant="ghost"
            >
              Load Draft
            </Button>
            <Button
              onClick={handleSaveDraft}
              size="sm"
              variant="ghost"
              disabled={!content.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>
            <Button
              onClick={handleClear}
              size="sm"
              variant="ghost"
              disabled={!content.trim() && !title.trim()}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <ConfigurableSimpleEditor
              content={content}
              onUpdate={(newContent: string) => setContent(newContent)}
              placeholder="Start writing your document..."
            />
          </div>

          <div className="flex items-center gap-2 justify-end pt-4">
            <Button
              onClick={handleExportToPdf}
              disabled={isExporting || !content.trim() || !title.trim()}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-1" />
              )}
              Add to Case Documents
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Create documents that will be converted to PDF and added to your case documents.</p>
            <p className="mt-1">Use &quot;Save Draft&quot; to save your work locally before exporting.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
