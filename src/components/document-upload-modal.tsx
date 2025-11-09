"use client";

import { useState, useCallback, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocuments, addUrlDocuments } from "@/actions/case";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import dayjs from "dayjs";

interface Document {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  fileSize?: number | null;
  category?: string | null;
  createdAt: string;
  fileUrl: string;
  document_metadata?: {
    documentType?: string;
    originalUrl?: string;
    [key: string]: unknown;
  } | null;
}

interface DocumentUploadModalProps {
  documents: Document[];
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UrlEntry {
  id: string;
  url: string;
  fetchContent: boolean;
}

export function DocumentUploadModal({
  documents,
  caseId,
  open,
  onOpenChange,
}: DocumentUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [urlEntries, setUrlEntries] = useState<UrlEntry[]>([
    { id: "1", url: "", fetchContent: false },
  ]);
  const [isAddingUrls, setIsAddingUrls] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      startTransition(async () => {
        try {
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) return prev;
              return prev + 10;
            });
          }, 300);

          const result = await uploadDocuments({
            caseId,
            files: acceptedFiles,
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (result.success) {
            setTimeout(() => {
              setIsUploading(false);
              setUploadProgress(0);
              router.refresh();
            }, 500);
          } else {
            console.error("Upload failed:", result.error);
            setIsUploading(false);
            setUploadProgress(0);
            alert("Upload failed: " + result.error);
          }
        } catch (error) {
          console.error("Upload failed:", error);
          setIsUploading(false);
          setUploadProgress(0);
          alert("Upload failed");
        }
      });
    },
    [caseId, router, startTransition]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    multiple: true,
  });

  const addUrlEntry = () => {
    setUrlEntries([
      ...urlEntries,
      { id: Date.now().toString(), url: "", fetchContent: false },
    ]);
  };

  const removeUrlEntry = (id: string) => {
    if (urlEntries.length > 1) {
      setUrlEntries(urlEntries.filter((entry) => entry.id !== id));
    }
  };

  const updateUrlEntry = (
    id: string,
    field: keyof UrlEntry,
    value: string | boolean
  ) => {
    setUrlEntries(
      urlEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleAddUrls = async () => {
    const validUrls = urlEntries.filter((entry) => entry.url.trim() !== "");
    if (validUrls.length === 0) {
      alert("Please enter at least one URL");
      return;
    }

    setIsAddingUrls(true);
    try {
      const result = await addUrlDocuments({
        caseId,
        urls: validUrls.map((entry) => ({
          url: entry.url,
          fetchContent: entry.fetchContent,
        })),
      });

      if (result.success) {
        const failedUrls = result.data?.filter((r: any) => !r.success) || [];
        if (failedUrls.length > 0) {
          alert(
            `Some URLs failed to process:\n${failedUrls
              .map((r: any) => `${r.url}: ${r.error}`)
              .join("\n")}`
          );
        } else {
          alert("All URLs added successfully!");
        }

        // Reset form
        setUrlEntries([{ id: "1", url: "", fetchContent: false }]);
        router.refresh();
      } else {
        alert("Failed to add URLs: " + result.error);
      }
    } catch (error) {
      console.error("Failed to add URLs:", error);
      alert("Failed to add URLs");
    } finally {
      setIsAddingUrls(false);
    }
  };

  const handleDownload = (document: Document) => {
    const docType = document.document_metadata?.documentType;
    if (docType === "url_reference" && document.document_metadata?.originalUrl) {
      window.open(document.document_metadata.originalUrl, "_blank");
    } else {
      window.open(document.fileUrl, "_blank");
    }
  };

  const handleDelete = (documentId: string) => {
    // TODO: Implement delete logic with confirmation
    console.log("Deleting document:", documentId);
  };

  const getDocumentIcon = (document: Document) => {
    const docType = document.document_metadata?.documentType;
    if (docType === "url_reference") {
      return <ExternalLink className="h-4 w-4 text-blue-600" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const getDownloadButtonText = (document: Document) => {
    const docType = document.document_metadata?.documentType;
    if (docType === "url_reference") {
      return "Open Link";
    }
    return "Download";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Management</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="links">Add Links</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="upload" className="mt-0 space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }
                  ${isUploading ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                {isUploading ? (
                  <div className="space-y-2">
                    <p className="text-sm">Uploading documents...</p>
                    <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {uploadProgress}% complete
                    </p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-sm">Drop the documents here...</p>
                ) : (
                  <div>
                    <p className="text-sm font-medium">
                      Drag & drop documents here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF, Images, Word documents
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-0 space-y-4">
              <div className="space-y-3">
                {urlEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`url-${entry.id}`}>
                          URL {index + 1}
                        </Label>
                        <Input
                          id={`url-${entry.id}`}
                          type="url"
                          placeholder="https://example.com/document.pdf"
                          value={entry.url}
                          onChange={(e) =>
                            updateUrlEntry(entry.id, "url", e.target.value)
                          }
                        />
                      </div>
                      {urlEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUrlEntry(entry.id)}
                          className="mt-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`reference-${entry.id}`}
                        name={`type-${entry.id}`}
                        checked={!entry.fetchContent}
                        onChange={() =>
                          updateUrlEntry(entry.id, "fetchContent", false)
                        }
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`reference-${entry.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Reference only (store link)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`fetch-${entry.id}`}
                        name={`type-${entry.id}`}
                        checked={entry.fetchContent}
                        onChange={() =>
                          updateUrlEntry(entry.id, "fetchContent", true)
                        }
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`fetch-${entry.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Fetch & analyze content
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addUrlEntry}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another URL
                </Button>
                <Button
                  type="button"
                  onClick={handleAddUrls}
                  disabled={isAddingUrls}
                  className="flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  {isAddingUrls ? "Adding..." : "Add URLs"}
                </Button>
              </div>
            </TabsContent>

            {/* Documents List - visible in both tabs */}
            <div className="mt-6 pt-6 border-t">
              {documents && documents.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Uploaded Documents ({documents.length})
                  </h4>
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDocumentIcon(doc)}
                          <span className="font-medium">{doc.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.category && (
                            <Badge variant="secondary">{doc.category}</Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="flex items-center gap-1"
                          >
                            {doc.document_metadata?.documentType ===
                            "url_reference" ? (
                              <ExternalLink className="h-3 w-3" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            {getDownloadButtonText(doc)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>File: {doc.fileName}</span>
                        <span>
                          Size:{" "}
                          {doc.fileSize
                            ? `${Math.round(doc.fileSize / 1024)} KB`
                            : "Unknown"}
                        </span>
                        <span>
                          Uploaded: {dayjs(doc.createdAt).format("MM/DD/YYYY")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
