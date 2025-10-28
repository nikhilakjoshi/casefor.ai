"use client";

import { useState } from "react";
import { SidebarClient } from "@/components/sidebar-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DocumentDropzone } from "@/components/document-dropzone";
import { ExtractedInfoPanel } from "@/components/extracted-info-panel";

interface DocumentCategory {
  fileName: string;
  category: string;
  confidence: number;
  rationale: string;
}

interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  label: string;
}

interface CaseDetails {
  caseTitle: string;
  documentCategory: string;
  categoryRationale: string;
  extractedFields: ExtractedField[];
}

interface ProcessedData {
  categories: DocumentCategory[];
  caseDetails: CaseDetails;
}

export default function NewCasePage() {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilesProcessed = (data: ProcessedData, files: File[]) => {
    setProcessedData(data);
    setOriginalFiles(files);
    setIsLoading(false);
  };

  const handleUploadStateChange = (uploading: boolean) => {
    setIsLoading(uploading);
  };

  return (
    <SidebarProvider>
      <SidebarClient />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/home">Cases</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>New Case</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Case
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload documents to automatically extract case information
            </p>
          </div>

          {/* Two-column layout with bg-gray-50 background */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Document Upload */}
            <DocumentDropzone
              onFilesProcessed={handleFilesProcessed}
              onUploadStateChange={handleUploadStateChange}
            />

            {/* Right Column - Extracted Information */}
            <ExtractedInfoPanel
              categories={processedData?.categories}
              caseDetails={processedData?.caseDetails}
              isLoading={isLoading}
              originalFiles={originalFiles}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
