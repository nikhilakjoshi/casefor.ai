// Shared types for case management

export interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  label: string;
}

export interface DocumentCategory {
  fileName: string;
  category: string;
  confidence: number;
  rationale: string;
}

export interface CaseDetails {
  caseTitle: string;
  documentCategory: string;
  categoryRationale: string;
  extractedFields: ExtractedField[];
}

export interface ProcessedData {
  categories: DocumentCategory[];
  caseDetails: CaseDetails;
}

export interface UploadedFile {
  file: File;
  preview?: string;
}

// S3 file info for storage
export interface S3FileInfo {
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Bucket?: string;
  s3Key?: string;
  fileUrl: string;
}

// Case creation payload (without files)
export interface CreateCasePayload {
  caseTitle: string;
  documentCategory: string;
  categoryRationale: string;
  extractedFields: ExtractedField[];
  categories: DocumentCategory[];
  assignedToId?: string;
}

// Document upload payload
export interface UploadDocumentsToCasePayload {
  caseId: string;
  files: File[];
  categories: DocumentCategory[];
}