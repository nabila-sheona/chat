import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (error: any) {
      let errorMessage = "Failed to login";

      if (error.code === "auth/user-not-found") {
        errorMessage = "User not found. Please sign up first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== "web") {
      Alert.alert("Info", "Google sign-in is currently available on web only");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Welcome Back</ThemedText>

      <ThemedText style={styles.subtitle}>
        Sign in to continue chatting
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading ? "Signing In..." : "Sign In"}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <ThemedText style={styles.dividerText}>OR</ThemedText>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, isLoading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        <Ionicons name="logo-google" size={20} color="#DB4437" />
        <ThemedText style={styles.googleButtonText}>
          Sign in with Google
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signupLink}
        onPress={() => router.push("/signup")}
        disabled={isLoading}
      >
        <ThemedText style={styles.signupLinkText}>
          Not have an account?{" "}
          <ThemedText style={styles.signupLinkBold}>Sign up</ThemedText>
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 32,
    color: "#000000",
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F2F2F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    fontSize: 16,
    color: "#000000",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  googleButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupLink: {
    alignItems: "center",
    marginTop: 20,
  },
  signupLinkText: {
    color: "#666",
    fontSize: 14,
  },
  signupLinkBold: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
