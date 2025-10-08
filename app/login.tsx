//'app/login.tsx'
import {
  registerForPushNotificationsAsync,
  sendPushTokenToServer,
} from "@/lib/api";
import { Redirect } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../lib/ctx";

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Destructure all necessary values from the auth context
  const { login, isLoading, token } = useAuth();

  /**
   * Handles the login button press.
   * Clears previous errors, attempts to log in, gets the push token,
   * and sends the push token to the server.
   * Sets an error message on failure.
   */
  const handleLogin = async () => {
    if (username && password) {
      setError(null);
      try {
        // 1) Login and get the bearer token
        const bearer = await login(username, password);

        // 2) Get Expo push token
        const expoToken = await registerForPushNotificationsAsync();

        // 3) Send it to backend
        if (expoToken) {
          await sendPushTokenToServer(bearer, expoToken);
          console.log("✅ Push token stored in backend");
        }
      } catch (e: any) {
        console.error("Login failed:", e);
        setError(e.message || "Login failed.");
      }
    }
  };

  // While the token is being loaded from storage for the first time, show a loading indicator.
  if (isLoading && !token) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading session...</Text>
      </View>
    );
  }

  // If a token exists, the user is logged in. Redirect to home screen.
  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, show the login form to the user.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        // Clear error when user starts typing
        onFocus={() => setError(null)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onFocus={() => setError(null)}
      />
      {/* Display error message if one exists */}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button
        title={isLoading ? "Logging in..." : "Log In"}
        onPress={handleLogin}
        disabled={isLoading || !username || !password}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default LoginScreen;
