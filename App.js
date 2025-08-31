import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AuthProvider } from "./contexts/AuthContext";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <AppNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
