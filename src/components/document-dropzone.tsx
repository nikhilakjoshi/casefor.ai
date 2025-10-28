"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  label: string;
}

interface ProcessedData {
  categories: Array<{
    fileName: string;
    category: string;
    confidence: number;
    rationale: string;
  }>;
  caseDetails: {
    caseTitle: string;
    documentCategory: string;
    categoryRationale: string;
    extractedFields: ExtractedField[];
  };
}

interface DocumentDropzoneProps {
  onFilesProcessed: (data: ProcessedData, originalFiles: File[]) => void;
  onUploadStateChange?: (uploading: boolean) => void;
}

export function DocumentDropzone({
  onFilesProcessed,
  onUploadStateChange,
}: DocumentDropzoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Automatically process the files
      if (acceptedFiles.length > 0) {
        setUploading(true);
        onUploadStateChange?.(true);
        setError(null);

        try {
          const formData = new FormData();
          acceptedFiles.forEach((file) => {
            formData.append("files", file);
          });

          const response = await fetch("/api/documents/process", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to process documents");
          }

          const data = await response.json();
          onFilesProcessed(data, acceptedFiles);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to process documents"
          );
        } finally {
          setUploading(false);
          onUploadStateChange?.(false);
        }
      }
    },
    [onFilesProcessed, onUploadStateChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <Card className="rounded-sm bg-white">
      <CardHeader>
        <CardTitle>Upload Files Here</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-sm bg-linear-to-r p-8 text-center transition-colors bg-gray-50 duration-180",
            isDragActive && "bg-blue-50",
            uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <input {...getInputProps()} disabled={uploading} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {uploading
              ? "Processing in progress..."
              : "Drag & drop files here, or click to select files"}
          </p>
          <p className="text-xs text-gray-500">
            Supported: PDF, TXT, Images (max 10MB per file)
          </p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Files:</p>
            {files.map((fileWrapper, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  <File className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">
                    {fileWrapper.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(fileWrapper.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Documents...
            </>
          ) : (
            `Process ${files.length} ${
              files.length === 1 ? "Document" : "Documents"
            }`
          )}
        </Button> */}

        {/* <h4 className="mb-1 text-lg">Instructions&#58;</h4> */}
        <ul className="space-y-1 text-xs text-gray-600 rounded-sm list-decimal list-inside">
          <li>
            Accepted File Types: PDF, TXT, and common image formats (PNG, JPG,
            JPEG, GIF, BMP, WebP)
          </li>
          <li>
            AI-Powered Analysis: Our AI uses advanced vision and text processing
            to extract information from PDFs, images, and text files including
            scanned documents and complex layouts.
          </li>
          <li>
            AI Accuracy: While our AI is highly accurate, please review the
            categorization and extracted information to ensure accuracy. AI can
            make mistakes.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
