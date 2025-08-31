import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [chatName, setChatName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !id) return;

    const fetchChatDetails = async () => {
      try {
        const chatDoc = await getDoc(doc(db, "chats", id as string));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          const otherParticipantId = data.participants.find(
            (participantId: string) => participantId !== currentUser.uid
          );

          if (otherParticipantId) {
            const userDoc = await getDoc(doc(db, "users", otherParticipantId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setChatName(
                userData.displayName || userData.email || "Unknown User"
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();

    // Changed order to 'desc' to show newest messages at the bottom
    const messagesQuery = query(
      collection(db, "chats", id as string, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt?.toDate(),
          user: {
            _id: data.user._id,
            name: data.user.name,
            avatar: data.user.avatar,
          },
        } as IMessage;
      });

      // Reverse the array to show newest at bottom
      setMessages(messagesData.reverse());

      if (messagesData.length > 0) {
        updateDoc(doc(db, "chats", id as string), {
          [`unreadCount.${currentUser.uid}`]: 0,
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser, id]);

  const onSend = useCallback(
    async (messages: IMessage[] = []) => {
      if (!currentUser || !id) return;

      try {
        const { text } = messages[0];

        await addDoc(collection(db, "chats", id as string, "messages"), {
          text,
          createdAt: serverTimestamp(),
          user: {
            _id: currentUser.uid,
            name: currentUser.email,
            avatar: currentUser.photoURL,
          },
        });

        await updateDoc(doc(db, "chats", id as string), {
          lastMessage: text,
          lastUpdated: serverTimestamp(),
          lastMessageSender: currentUser.uid,
        });

        const chatDoc = await getDoc(doc(db, "chats", id as string));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          const otherParticipantId = data.participants.find(
            (participantId: string) => participantId !== currentUser.uid
          );

          if (otherParticipantId) {
            await updateDoc(doc(db, "chats", id as string), {
              [`unreadCount.${otherParticipantId}`]:
                (data.unreadCount?.[otherParticipantId] || 0) + 1,
            });
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send message");
      }
    },
    [currentUser, id]
  );

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Text>Loading chat...</Text>
      </ThemedView>
    );
  }

  if (!currentUser) {
    return (
      <ThemedView style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text>Please login to continue</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#007AFF"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.chatName}>{chatName}</Text>
      </View>

      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: currentUser.uid,
          name: currentUser.email || "User",
          avatar: currentUser.photoURL || "https://place-hold.it/100x100",
        }}
        showAvatarForEveryMessage={true}
        renderUsernameOnMessage={true}
        placeholder="Type a message..."
        alwaysShowSend={true}
        // These props ensure proper message ordering
        inverted={false}
        isTyping={false}
        loadEarlier={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    marginRight: 16,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
});
