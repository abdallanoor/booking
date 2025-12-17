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
          folder: "booking-app",
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
