"use client";

import { useState, useCallback, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { uploadDocuments } from "@/actions/case";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Trash2, Plus } from "lucide-react";
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
}

interface DocumentManagementPanelProps {
  documents: Document[];
  caseId: string;
}

export function DocumentManagementPanel({ documents, caseId }: DocumentManagementPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    startTransition(async () => {
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
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
          console.log("Upload completed:", result.data);
          // Give user a moment to see 100% progress
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            router.refresh(); // Refresh to show new documents
          }, 500);
        } else {
          console.error("Upload failed:", result.error);
          setIsUploading(false);
          setUploadProgress(0);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setIsUploading(false);
        setUploadProgress(0);
      }
    });
  }, [caseId, router, startTransition]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true
  });

  const handleDownload = (document: Document) => {
    // TODO: Implement secure download logic
    console.log("Downloading:", document.fileName);
    window.open(document.fileUrl, '_blank');
  };

  const handleDelete = (documentId: string) => {
    // TODO: Implement delete logic with confirmation
    console.log("Deleting document:", documentId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Documents</CardTitle>
        <CardDescription>
          All documents associated with this case
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          {isUploading ? (
            <div className="space-y-2">
              <p className="text-sm">Uploading documents...</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          ) : isDragActive ? (
            <p className="text-sm">Drop the documents here...</p>
          ) : (
            <div>
              <p className="text-sm">Drag & drop documents here, or click to select</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, Images, Word documents
              </p>
            </div>
          )}
        </div>

        {/* Documents List */}
        {documents && documents.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Uploaded Documents ({documents.length})</h4>
            </div>
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
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
                      <Download className="h-3 w-3" />
                      Download
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
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>File: {doc.fileName}</span>
                  <span>Size: {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "Unknown"}</span>
                  <span>Uploaded: {dayjs(doc.createdAt).format('MM/DD/YYYY')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            <p className="text-xs text-muted-foreground">Upload your first document using the area above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}