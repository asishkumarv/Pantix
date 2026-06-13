import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - The file buffer from multer.
 * @param {string} folder - The destination folder on Cloudinary.
 * @returns {Promise<object>} - Resolves with the Cloudinary upload result.
 */
export const uploadToCloudinary = (fileBuffer, folder = "pantix") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
