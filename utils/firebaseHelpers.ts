import { db } from "@/config/firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

interface UserProfile {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export const createUserProfile = async (
  userId: string,
  userData: UserProfile
) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // create new
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // update existing
      await setDoc(
        userRef,
        {
          ...userData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
  }
};



