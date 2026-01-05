import {
  ref,
  uploadBytes,
  getDownloadURL,
  getStorage,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";

export async function singleImageSubmission(file: File, path: string) {
  if (!file) return;

  const fileRename = file.name;

  const storageRef = ref(storage, `images/${path}/${fileRename}`);

  let url;

  try {
    await uploadBytes(storageRef, file);
    url = await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading the file", error);
  }

  return url;
}

export async function deleteSingleImage(imageUrl: string) {
  if (!imageUrl) {
    console.error("No image URL provided");
    return false;
  }

  try {
    // Create a reference from the URL
    const storageRef = ref(storage, imageUrl);

    // Delete the file
    await deleteObject(storageRef);
    console.log("Image deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting the image", error);
    return false;
  }
}
