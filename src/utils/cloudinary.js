import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File has been uploaded successfully !! ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error uploading file to cloudinary: ", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    console.log("File has been deleted successfully !! ", publicId);
    return response;
  } catch (error) {
    console.log("Error deleting file from cloudinary: ", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
