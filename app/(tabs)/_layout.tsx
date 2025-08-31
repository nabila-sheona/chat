import { Tabs } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#eee",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
