import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName });
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.titleText}>
          Profile
        </ThemedText>
      </View>

      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: currentUser?.photoURL || "https://place-hold.it/100x100",
          }}
          style={styles.avatar}
        />
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />
        ) : (
          <ThemedText style={styles.displayName}>
            {displayName || "No name set"}
          </ThemedText>
        )}

        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
        >
          <ThemedText style={styles.buttonText}>
            {isEditing ? "Save" : "Edit Profile"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={logout}
        >
          <ThemedText style={styles.buttonText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  titleText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  displayName: {
    color: "#000000",
    fontSize: 18,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    width: "80%",
    borderColor: "#E5E5E5",
    color: "#000000",
    marginBottom: 20,
  },
  button: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
