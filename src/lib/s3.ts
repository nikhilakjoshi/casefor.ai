// S3 utilities for file upload and management via backend API
import { uploadToBackend } from "./backend-api";

export interface S3UploadResult {
  success: boolean;
  fileUrl?: string;
  bucket?: string;
  key?: string;
  error?: string;
  warning?: string;
  chunksCreated?: number;
  documentsProcessed?: number;
}

export async function uploadFileToS3(
  file: File,
  caseId: string
): Promise<S3UploadResult> {
  try {
    const backendResult = await uploadToBackend(file);
    
    if (!backendResult.success) {
      return {
        success: false,
        error: backendResult.error,
      };
    }

    const data = backendResult.data!;
    
    // Extract bucket and key from S3 URL if available
    let bucket: string | undefined;
    let key: string | undefined;
    
    if (data.s3_url) {
      try {
        const url = new URL(data.s3_url);
        const pathParts = url.pathname.substring(1).split('/');
        bucket = url.hostname.split('.')[0]; // Extract bucket from hostname
        key = pathParts.join('/'); // Rest of path is the key
      } catch (urlError) {
        console.warn("Could not parse S3 URL:", data.s3_url);
      }
    }
    
    return {
      success: true,
      fileUrl: data.s3_url || undefined,
      bucket,
      key,
      warning: data.warning,
      chunksCreated: data.chunks_created,
      documentsProcessed: data.documents_processed,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFileFromS3(bucket: string, key: string): Promise<boolean> {
  try {
    // TODO: Implement S3 deletion
    console.log("Mock S3 delete for:", bucket, key);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    return false;
  }
}

// Generate a presigned URL for direct uploads (optional)
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string | null> {
  try {
    // TODO: Implement presigned URL generation
    console.log("Mock presigned URL for:", key, contentType);
    return `https://your-bucket.s3.amazonaws.com/${key}?presigned=true`;
  } catch (error) {
    console.error("Presigned URL error:", error);
    return null;
  }
}