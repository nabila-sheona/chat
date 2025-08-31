import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDocs,
} from "firebase/firestore";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  avatar: string;
}

export default function ChatListScreen() {
  const { currentUser, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      console.log("No current user found");
      return;
    }

    console.log("Current user UID:", currentUser.uid);

    // First, let's check what chats exist in the database
    const checkAllChats = async () => {
      try {
        const allChatsSnapshot = await getDocs(collection(db, "chats"));
        console.log("All chats in database:", allChatsSnapshot.docs.length);
        allChatsSnapshot.docs.forEach((doc) => {
          console.log("Chat ID:", doc.id, "Data:", doc.data());
        });
      } catch (error) {
        console.error("Error checking all chats:", error);
      }
    };

    checkAllChats();

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastUpdated", "desc")
    );

    console.log("Setting up chat listener...");

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        console.log("Chats query returned:", snapshot.docs.length, "chats");

        if (snapshot.docs.length === 0) {
          console.log("No chats found for user:", currentUser.uid);
          console.log("This could mean:");
          console.log("1. No chats exist with this user as participant");
          console.log("2. Firestore index is missing");
          console.log("3. Security rules are blocking access");
        }

        const chatsData: Chat[] = snapshot.docs.map((chatDoc) => {
          const data = chatDoc.data();
          console.log("Processing chat:", chatDoc.id, data);

          const otherParticipantId = data.participants.find(
            (id: string) => id !== currentUser.uid
          );

          console.log("Other participant ID:", otherParticipantId);

          let chatName = "Unknown User";
          let avatar = "https://place-hold.it/100x100";

          return {
            id: chatDoc.id,
            name: chatName,
            lastMessage: data.lastMessage || "No messages yet",
            timestamp: data.lastUpdated?.toDate() || new Date(),
            unreadCount: data.unreadCount?.[currentUser.uid] || 0,
            avatar,
          };
        });

        setChats(chatsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error in chats snapshot:", error);
        if (error.code === "failed-precondition") {
          Alert.alert(
            "Index Required",
            "Please create the Firestore index for chats query. Check console for details."
          );
          console.log("Index creation link should appear in Firebase console");
        } else {
          Alert.alert("Error", "Failed to load chats: " + error.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={50} color="#A1CEDC" />
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText style={styles.chatName}>{item.name}</ThemedText>
          <ThemedText style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>
        <ThemedText style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </ThemedText>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <ThemedText style={styles.unreadText}>{item.unreadCount}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading chats...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.titleText}>Chats</ThemedText>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#A1CEDC" />
            <ThemedText style={styles.emptyText}>No chats yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Start a conversation from the Contacts tab!
            </ThemedText>
            <ThemedText style={styles.debugText}>
              User UID: {currentUser?.uid}
            </ThemedText>
          </View>
        }
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  titleText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 8,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  avatarContainer: {
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    color: "#000000",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  debugText: {
    marginTop: 16,
    color: "#999",
    fontSize: 12,
    fontFamily: "monospace",
  },
});
