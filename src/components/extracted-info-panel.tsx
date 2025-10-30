"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNewCase, uploadDocumentsToCase } from "@/actions/case";
import type { CreateCasePayload, UploadDocumentsToCasePayload } from "@/types/case";

// Custom hook for animated dots
function useAnimatedDots() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ".";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return dots;
}
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  extractedFields: ExtractedField[];
}

interface ExtractedInfoPanelProps {
  categories?: DocumentCategory[];
  caseDetails?: CaseDetails;
  isLoading?: boolean;
  originalFiles?: File[]; // Add original files for upload
}

export function ExtractedInfoPanel({
  categories,
  caseDetails,
  isLoading = false,
  originalFiles = [],
}: ExtractedInfoPanelProps) {
  const [editedCaseTitle, setEditedCaseTitle] = useState(
    caseDetails?.caseTitle || ""
  );
  const [editedFields, setEditedFields] = useState<ExtractedField[]>(
    caseDetails?.extractedFields || []
  );
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [caseCreationError, setCaseCreationError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'creating-case' | 'uploading-documents'>('idle');
  const animatedDots = useAnimatedDots();
  const router = useRouter();

  useEffect(() => {
    if (caseDetails) {
      setEditedCaseTitle(caseDetails.caseTitle);
      setEditedFields(caseDetails.extractedFields);
    }
  }, [caseDetails]);

  const updateFieldValue = (index: number, newValue: string) => {
    setEditedFields((prev) =>
      prev.map((field, i) =>
        i === index ? { ...field, fieldValue: newValue } : field
      )
    );
  };

  const renderFieldInput = (field: ExtractedField, index: number) => {
    if (field.fieldValue.length > 100) {
      return (
        <Textarea
          value={field.fieldValue}
          onChange={(e) => updateFieldValue(index, e.target.value)}
          rows={3}
        />
      );
    }
    return (
      <Input
        value={field.fieldValue}
        onChange={(e) => updateFieldValue(index, e.target.value)}
      />
    );
  };

  const handleCreateCase = async () => {
    if (!caseDetails || !categories) {
      setCaseCreationError("Missing case details or categories");
      return;
    }

    if (!editedCaseTitle.trim()) {
      setCaseCreationError("Case title is required");
      return;
    }

    if (originalFiles.length === 0) {
      setCaseCreationError("No files to upload");
      return;
    }

    setIsCreatingCase(true);
    setCaseCreationError(null);

    try {
      // Phase 1: Create case without files
      setCurrentPhase('creating-case');
      
      const casePayload: CreateCasePayload = {
        caseTitle: editedCaseTitle,
        documentCategory: caseDetails.documentCategory,
        categoryRationale: caseDetails.categoryRationale,
        extractedFields: editedFields,
        categories: categories,
      };

      const caseResult = await createNewCase(casePayload);

      if (!caseResult.success) {
        throw new Error(caseResult.error || "Failed to create case");
      }

      const caseId = caseResult.data!.caseId;

      // Phase 2: Upload documents with proper case ID
      setCurrentPhase('uploading-documents');
      setIsUploadingDocuments(true);

      const uploadPayload: UploadDocumentsToCasePayload = {
        caseId,
        files: originalFiles,
        categories: categories,
      };

      const uploadResult = await uploadDocumentsToCase(uploadPayload);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload documents");
      }

      // Check if any individual file uploads failed
      const failedUploads = uploadResult.data?.uploadResults.filter(r => !r.success) || [];
      if (failedUploads.length > 0) {
        console.warn("Some files failed to upload:", failedUploads);
        // Continue anyway - case is created, some documents uploaded
      }

      // Success! Navigate to the case details page
      console.log("Case and documents created successfully:", { 
        caseId, 
        uploadResults: uploadResult.data?.uploadResults 
      });
      
      router.push(`/home/cases/${caseId}`);

    } catch (error) {
      console.error("Error in case creation process:", error);
      setCaseCreationError(
        error instanceof Error ? error.message : "Failed to create case"
      );
    } finally {
      setIsCreatingCase(false);
      setIsUploadingDocuments(false);
      setCurrentPhase('idle');
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-sm bg-white">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-gray-600">
            Extracting Information{animatedDots}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!categories && !caseDetails) {
    return (
      <Card className="rounded-sm bg-white">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 h-full">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Upload documents to see extracted information here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-sm bg-white gap-0">
      <CardHeader className="border-b gap-0">
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <ScrollArea className="max-h-[50vh] overflow-y-auto">
        <CardContent className="space-y-6">
          {/* Document Categories */}
          {categories && categories.length > 0 && (
            <div className="space-y-3 pt-6">
              <h3 className="text-sm font-semibold">Document Categorization</h3>
              <div className="space-y-3">
                {categories.map((doc, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate">
                          {doc.fileName}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {doc.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {doc.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Disclaimer */}
          {(categories || caseDetails) && (
            <div className="flex gap-2 p-3 border rounded-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                This information was extracted using AI. Please review and
                verify all details for accuracy.
              </p>
            </div>
          )}

          {/* Case Details Form */}
          {caseDetails && (
            <div className="space-y-4 pt-4 pb-6 border-t">
              <h3 className="text-sm font-semibold">
                Extracted Case Information
              </h3>

              {/* Case Title - Always shown first */}
              <div className="space-y-2">
                <Label htmlFor="case-title">Case Title (Required)</Label>
                <Input
                  id="case-title"
                  value={editedCaseTitle}
                  onChange={(e) => setEditedCaseTitle(e.target.value)}
                  placeholder="Case title"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500">
                  {editedCaseTitle.length}/50 characters
                </p>
              </div>

              {/* Dynamic Fields */}
              {editedFields.length > 0 && (
                <div className="space-y-4">
                  {editedFields.map((field, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`field-${index}`}>{field.label}</Label>
                      {renderFieldInput(field, index)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </ScrollArea>
      <CardFooter className="w-full border-t">
        {/* Case Creation Error */}
        {caseCreationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-sm text-red-600">{caseCreationError}</p>
          </div>
        )}

        {/* Action Buttons */}
        {(categories || caseDetails) && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditedCaseTitle(caseDetails?.caseTitle || "");
                setEditedFields(caseDetails?.extractedFields || []);
                setCaseCreationError(null);
              }}
            >
              Reset Changes
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateCase}
              disabled={isCreatingCase || isUploadingDocuments || !editedCaseTitle.trim()}
            >
              {currentPhase === 'creating-case' && "Creating Case..."}
              {currentPhase === 'uploading-documents' && "Uploading Documents..."}
              {currentPhase === 'idle' && "Create Case with This Info"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
