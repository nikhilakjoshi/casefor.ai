"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onFilesProcessed: (data: ProcessedData) => void;
}

export function DocumentDropzone({ onFilesProcessed }: DocumentDropzoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
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
      onFilesProcessed(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process documents"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="rounded-sm bg-white">
      <CardHeader>
        <CardTitle>Upload Files Here</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-sm bg-linear-to-r p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "from-blue-50 to-gray-50 scale-95"
              : "border-gray-300 hover:border-gray-400 from-gray-50 to-blue-50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag & drop files here, or click to select files
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

        <Button
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
        </Button>

        <h4 className="mb-1">Instructions&#58;</h4>
        <div className="space-y-1 text-xs text-gray-600 p-3 rounded-sm px-4">
          <p>
            <strong>Accepted File Types:</strong> PDF, TXT, and common image
            formats (PNG, JPG, JPEG, GIF, BMP, WebP)
          </p>
          <p>
            <strong>AI-Powered Analysis:</strong> Our AI uses advanced vision
            and text processing to extract information from PDFs, images, and
            text files including scanned documents and complex layouts.
          </p>
          <p>
            <strong>AI Accuracy:</strong> While our AI is highly accurate,
            please review the categorization and extracted information to ensure
            accuracy. AI can make mistakes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
