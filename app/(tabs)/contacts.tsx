import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/config/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  doc,
} from "firebase/firestore";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export default function ContactsScreen() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
            photoURL: data.photoURL || "https://place-hold.it/100x100",
          };
        });

      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, users]);

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
        <ThemedText type="title" style={styles.titleText}>
          Contacts
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          {users.length} users found
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => startChat(item)}
          >
            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
  titleText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#F2F2F7",
    margin: 12,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
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
