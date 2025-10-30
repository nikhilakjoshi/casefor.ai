"use server";

interface BackendUploadResponse {
  message: string;
  filename: string;
  case_id: string;
  case_document_id?: string;
  documents_processed: number;
  chunks_created: number;
  file_type: string;
  s3_url: string | null;
  warning?: string;
  s3_error?: string;
}

interface DocumentResponse {
  filename: string;
  content: string;
  case_id: string;
  case_document_id?: string | null;
  chunk_count: number;
  upload_timestamp: string;
}

interface DocumentsResponse {
  case_id: string;
  case_document_id?: string;
  total_documents: number;
  documents: DocumentResponse[];
  markdown_content: string;
}

interface BackendErrorResponse {
  detail: string;
}

interface UploadResult {
  success: boolean;
  data?: BackendUploadResponse;
  error?: string;
}

interface DocumentsResult {
  success: boolean;
  data?: DocumentsResponse;
  error?: string;
}

export async function uploadToBackend(
  file: File, 
  caseId: string, 
  caseDocumentId?: string
): Promise<UploadResult> {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error("BACKEND_API_URL environment variable not set");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("case_id", caseId);
    
    if (caseDocumentId) {
      formData.append("case_document_id", caseDocumentId);
    }

    const response = await fetch(`${backendUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData: BackendErrorResponse = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse JSON, use the default error message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: BackendUploadResponse = await response.json();
    
    return {
      success: true,
      data,
    };

  } catch (error) {
    console.error("Backend upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getDocumentsForCase(
  caseId: string, 
  caseDocumentId?: string
): Promise<DocumentsResult> {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error("BACKEND_API_URL environment variable not set");
    }

    const params = new URLSearchParams({ case_id: caseId });
    if (caseDocumentId) {
      params.append("case_document_id", caseDocumentId);
    }

    const response = await fetch(`${backendUrl}/documents?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData: BackendErrorResponse = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse JSON, use the default error message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: DocumentsResponse = await response.json();
    
    return {
      success: true,
      data,
    };

  } catch (error) {
    console.error("Backend documents retrieval error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}