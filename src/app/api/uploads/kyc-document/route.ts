import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { uploadImage, MAX_UPLOAD_SIZE_BYTES } from "@/lib/cloudinary";

// Intentionally unauthenticated: this route is called during step 2 of
// registration, before the account exists (registration is a single final
// submit). Abuse is mitigated by file-type/size validation here plus the
// blanket per-IP rate limiter already applied to all /api/* routes in
// src/middleware.ts.
export const POST = apiHandler(async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return errorResponse("No file provided", 400);
  }
  if (!file.type.startsWith("image/")) {
    return errorResponse("Only image files are allowed", 400);
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return errorResponse("File is too large (max 5MB)", 413);
  }

  const url = await uploadImage(file, "vestriq/kyc");
  return successResponse({ url }, "Document uploaded successfully");
});
