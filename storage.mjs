import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
});

const uploadImage = async (filePath) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: "game_app",
  });
};
