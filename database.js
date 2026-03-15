// database.js
import { db } from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";

export async function createUser(username, email) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      username: username,
      email: email,
      createdAt: new Date()
    });

    console.log("User created with ID:", docRef.id);
  } catch (e) {
    console.error("Error adding document:", e);
  }
}