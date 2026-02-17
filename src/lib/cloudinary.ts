import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload one or more images to Cloudinary.
 * Cloudinary handles compression (q_auto) and WebP conversion (f_auto) automatically.
 */
export async function uploadImages(
  files: File[],
  folder = "booking-app"
): Promise<string[]> {
  const uploadOne = (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto",
            quality: "auto:eco",
            format: "webp",
            transformation: [{ width: 1200, crop: "limit" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        )
        .end(buffer);
    });
  };

  return Promise.all(files.map(uploadOne));
}

export async function deleteImageFromCloudinary(
  imageUrl: string
): Promise<void> {
  try {
    // Extract public_id from URL
    // Regex to capture the public ID part:
    // Matches everything after 'upload/' and optionally a version 'v12345/'
    // until the last dot (extension)
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = imageUrl.match(regex);

    if (!match || !match[1]) {
      return;
    }

    const publicId = match[1];

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { invalidate: true }, (error) => {
        if (error) {
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
