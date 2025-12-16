import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "booking-properties",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      )
      .end(buffer);
  });
}

export async function deleteImageFromCloudinary(
  imageUrl: string
): Promise<void> {
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[id].[extension]
    // We want: [folder]/[id]

    // Split by '/'
    const parts = imageUrl.split("/");

    // Find 'upload' index
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return;

    // Everything after 'upload' and 'v[version]' roughly, but easier:
    // Cloudinary public IDs can be extracted more robustly:
    // Get the part after the version number (which starts with v)
    // Actually, usually it's sufficient to take everything after the version,
    // and remove the extension.

    // Standard approach:
    const versionIndex = uploadIndex + 1;
    // content starts after version
    const contentParts = parts.slice(versionIndex + 1);
    const filenameWithExt = contentParts.join("/");
    const publicId = filenameWithExt.split(".")[0];

    if (!publicId) return;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Cloudinary delete error:", error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
}
