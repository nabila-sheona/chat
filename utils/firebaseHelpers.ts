import { db } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
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

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const searchUsers = async (searchTerm: string): Promise<any[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("email", ">=", searchTerm),
      where("email", "<=", searchTerm + "\uf8ff")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};
// Add this to your firebaseHelpers.ts file
export const getOrCreateChat = async (user1Id: string, user2Id: string) => {
  try {
    // Create a consistent chat ID regardless of parameter order
    const chatId = [user1Id, user2Id].sort().join('_');
    const chatRef = doc(db, "chats", chatId);
    
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      // Create new chat
      await setDoc(chatRef, {
        participants: [user1Id, user2Id],
        lastUpdated: new Date(),
        lastMessage: "",
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        }
      });
    }
    
    return chatId;
  } catch (error) {
    console.error("Error getting or creating chat:", error);
    throw error;
  }
};