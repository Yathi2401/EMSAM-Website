import mongoose from "../config/db.js";

export function paperBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "paper_files" });
}

export async function storePaper(buffer, filename) {
  const upload = paperBucket().openUploadStream(filename, { metadata: { contentType: "application/pdf" } });
  await new Promise((resolve, reject) => {
    upload.on("finish", resolve);
    upload.on("error", reject);
    upload.end(buffer);
  });
  return upload.id;
}
