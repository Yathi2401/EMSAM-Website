import mongoose from "../config/db.js";

export const imagePrefix = "/api/announcement-images/";
export function imageBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "announcement_images",
  });
}

export function imageType(buffer) {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return "image/jpeg";
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function saveImage(file) {
  const contentType = imageType(file.buffer);
  if (!contentType)
    throw Object.assign(new Error("Choose a JPG, PNG or WebP photo."), { status: 400 });
  const upload = imageBucket().openUploadStream("announcement-photo", {
    metadata: { contentType },
  });
  await new Promise((resolve, reject) => {
    upload.on("finish", resolve);
    upload.on("error", reject);
    upload.end(file.buffer);
  });
  return `${imagePrefix}${upload.id}`;
}

export async function removeImage(url) {
  if (!url?.startsWith(imagePrefix)) return;
  const id = url.slice(imagePrefix.length);
  if (!mongoose.isObjectIdOrHexString(id)) return;
  // Cleanup must not turn a successful announcement save into a failed response.
  await imageBucket()
    .delete(new mongoose.Types.ObjectId(id))
    .catch((error) => console.error("Photo cleanup failed:", error.message));
}
