import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { Platform } from "react-native";
import { createUserProfile } from "@/utils/firebaseHelpers";

interface AuthContextType {
  currentUser: User | null;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await createUserProfile(result.user.uid, {
      email: result.user.email,
      displayName: result.user.email?.split("@")[0] || "User",
      photoURL: result.user.photoURL,
    });

    return result;
  };

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    if (Platform.OS === "web") {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user.uid, {
        email: result.user.email,
        displayName:
          result.user.displayName || result.user.email?.split("@")[0],
        photoURL: result.user.photoURL,
      });
      return result;
    } else {
      throw new Error("Google sign-in not implemented for mobile yet");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, signup, login, logout, signInWithGoogle }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
