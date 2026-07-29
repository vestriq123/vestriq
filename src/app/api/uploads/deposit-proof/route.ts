import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { uploadImage, MAX_UPLOAD_SIZE_BYTES } from "@/lib/cloudinary";

export const POST = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

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

  const url = await uploadImage(file, "vestriq/deposit-proofs");
  return successResponse({ url }, "Proof of payment uploaded successfully");
});
