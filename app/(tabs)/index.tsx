import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
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

    const loadChats = async () => {
      try {
        // First try to query with the proper index
        const chatsQuery = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUser.uid),
          orderBy("lastUpdated", "desc")
        );

        const unsubscribe = onSnapshot(
          chatsQuery,
          async (snapshot) => {
            const chatsData: Chat[] = await Promise.all(
              snapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();

                const otherParticipantId = data.participants.find(
                  (id: string) => id !== currentUser.uid
                );

                let chatName = "Unknown User";
                let avatar = "https://place-hold.it/100x100";

                if (otherParticipantId) {
                  try {
                    const userDoc = await getDoc(
                      doc(db, "users", otherParticipantId)
                    );
                    if (userDoc.exists()) {
                      const userData = userDoc.data();
                      chatName =
                        userData.displayName ||
                        userData.email ||
                        "Unknown User";
                      avatar = userData.photoURL || avatar;
                    }
                  } catch (error) {
                    console.error("Error fetching user data:", error);
                  }
                }

                return {
                  id: chatDoc.id,
                  name: chatName,
                  lastMessage: data.lastMessage || "No messages yet",
                  timestamp: data.lastUpdated?.toDate() || new Date(),
                  unreadCount: data.unreadCount?.[currentUser.uid] || 0,
                  avatar,
                };
              })
            );

            setChats(chatsData);
            setLoading(false);
          },
          async (error) => {
            console.error("Error in chats snapshot:", error);

            // If the query fails due to missing index, try a fallback approach
            if (error.code === "failed-precondition") {
              console.log("Index missing, trying fallback approach");

              try {
                // Get all chats and filter client-side
                const allChatsSnapshot = await getDocs(collection(db, "chats"));
                const allChats = allChatsSnapshot.docs;

                const userChats = allChats.filter((chatDoc) => {
                  const data = chatDoc.data();
                  return (
                    data.participants &&
                    data.participants.includes(currentUser.uid)
                  );
                });

                // Sort by lastUpdated manually
                userChats.sort((a, b) => {
                  const aTime = a.data().lastUpdated?.toDate() || new Date(0);
                  const bTime = b.data().lastUpdated?.toDate() || new Date(0);
                  return bTime.getTime() - aTime.getTime();
                });

                const chatsData: Chat[] = await Promise.all(
                  userChats.map(async (chatDoc) => {
                    const data = chatDoc.data();
                    const otherParticipantId = data.participants.find(
                      (id: string) => id !== currentUser.uid
                    );

                    let chatName = "Unknown User";
                    let avatar = "https://place-hold.it/100x100";

                    if (otherParticipantId) {
                      try {
                        const userDoc = await getDoc(
                          doc(db, "users", otherParticipantId)
                        );
                        if (userDoc.exists()) {
                          const userData = userDoc.data();
                          chatName =
                            userData.displayName ||
                            userData.email ||
                            "Unknown User";
                          avatar = userData.photoURL || avatar;
                        }
                      } catch (error) {
                        console.error("Error fetching user data:", error);
                      }
                    }

                    return {
                      id: chatDoc.id,
                      name: chatName,
                      lastMessage: data.lastMessage || "No messages yet",
                      timestamp: data.lastUpdated?.toDate() || new Date(),
                      unreadCount: data.unreadCount?.[currentUser.uid] || 0,
                      avatar,
                    };
                  })
                );

                setChats(chatsData);
                setLoading(false);

                Alert.alert(
                  "Info",
                  "Please create a Firestore index for chats query. Check console for details."
                );
              } catch (fallbackError) {
                console.error("Fallback approach also failed:", fallbackError);
                Alert.alert("Error", "Failed to load chats: " + error.message);
                setLoading(false);
              }
            } else {
              Alert.alert("Error", "Failed to load chats: " + error.message);
              setLoading(false);
            }
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up chat listener:", error);
        setLoading(false);
      }
    };

    loadChats();
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
            {item.timestamp.toLocaleDateString()}{" "}
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
});
