"use server";

interface BackendUploadResponse {
  message: string;
  filename: string;
  documents_processed: number;
  chunks_created: number;
  file_type: string;
  s3_url: string | null;
  warning?: string;
  s3_error?: string;
}

interface BackendErrorResponse {
  detail: string;
}

interface UploadResult {
  success: boolean;
  data?: BackendUploadResponse;
  error?: string;
}

export async function uploadToBackend(file: File): Promise<UploadResult> {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error("BACKEND_API_URL environment variable not set");
    }

    const formData = new FormData();
    formData.append("file", file);

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