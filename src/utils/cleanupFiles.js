import fs from "fs";

const cleanupLocalFiles = (files) => {
  if (!files) return;
  Object.values(files).forEach((fileArray) => {
    fileArray?.forEach((file) => {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  });
};

export { cleanupLocalFiles };
