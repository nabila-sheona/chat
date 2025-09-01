import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: string;
  email: string;
  displayName: string;
}

export default function ContactsScreen() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "users"), orderBy("email"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = snapshot.docs
        .filter((doc) => doc.id !== currentUser.uid)
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || "No email",
            displayName: data.displayName || data.email || "Unknown User",
          };
        });

      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const startChat = async (otherUser: User) => {
    if (!currentUser) return;
    try {
      const chatId = [currentUser.uid, otherUser.id].sort().join("_");
      const chatRef = doc(db, "chats", chatId);

      await setDoc(
        chatRef,
        {
          participants: [currentUser.uid, otherUser.id],
          lastUpdated: new Date(),
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUser.id]: 0,
          },
        },
        { merge: true }
      );

      router.push(`/chat/${chatId}`);
    } catch (error) {
      Alert.alert("Error", "Failed to start chat");
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading contacts...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="default" style={styles.subtitle}>
          {users.length} users found
        </ThemedText>
      </View>

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => startChat(item)}
          >
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={48} color="#A1CEDC" />
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {item.displayName}
              </ThemedText>
              <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
            </View>
            <Ionicons name="chatbubble-ellipses" size={22} color="#007AFF" />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  avatarContainer: { marginRight: 12 },
  userInfo: { flex: 1 },
  userName: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  userEmail: {
    color: "#666",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});
