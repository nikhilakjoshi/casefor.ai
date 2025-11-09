"use client";

import { useState, useEffect } from "react";
import { DocumentUploadModal } from "./document-upload-modal";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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

interface DocumentsTabTriggerProps {
  documents: Document[];
  caseId: string;
}

export function DocumentsTabTrigger({ documents, caseId }: DocumentsTabTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <TabsContent value="documents" className="space-y-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setIsModalOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Management
            </CardTitle>
            <CardDescription>
              Click to upload files or add document links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Button variant="outline" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Open Document Manager
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <DocumentUploadModal
        documents={documents}
        caseId={caseId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
