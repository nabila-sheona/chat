import { auth } from "@/config/firebase";
import { createUserProfile } from "@/utils/firebaseHelpers";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

interface AuthContextType {
  currentUser: User | null;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<UserCredential>;
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

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with display name
    await updateProfile(result.user, { displayName });

    await createUserProfile(result.user.uid, {
      email: result.user.email,
      displayName: displayName,
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
export default AuthContext;
