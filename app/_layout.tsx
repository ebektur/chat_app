// app/_layout.tsx
import { AuthProvider } from "@/lib/ctx";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Redirect, router, Stack, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Platform, useColorScheme } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [authReady, setAuthReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Bootstrap auth once
  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync("authToken");
      setHasToken(!!t);
      setAuthReady(true);
    })();
  }, []);

  // Push registration once (guard Strict Mode)
  const didRunPushRef = useRef(false);
  useEffect(() => {
    if (didRunPushRef.current) return;
    didRunPushRef.current = true;

    (async () => {
      try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") return;

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          console.warn("⚠️ Missing EAS projectId in app.json -> extra.eas.projectId");
          return;
        }

        const { data: expoToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log("✅ Expo Push Token:", expoToken);
      } catch (e) {
        console.warn("❌ push setup error:", e);
      }
    })();
  }, []);

  // Push tap → navigate to /chat with params
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as
    | { type?: string; chatId?: string | number; name?: string }
    | undefined;

  if (data?.type === "chat_message" && data?.chatId != null) {
    router.push({
      pathname: "/chat",
      params: {
        chatId: String(data.chatId),
        name: data.name ?? "Chat",
      },
    });
  }
});
    return () => sub.remove();
  }, []);

  if (!fontsLoaded || !authReady) return null;

  // Protected area is your “main app”: index, explore, send
  const protectedFirst = new Set(["", "index", "explore", "send"]);
  const first = segments?.[0] ?? ""; // "" corresponds to / (index)

  // If unauthenticated and trying to access protected area → login
  if (!hasToken && protectedFirst.has(first)) return <Redirect href="/login" />;

  // If authenticated and on login → go to index
  if (hasToken && first === "login") return <Redirect href="/" />;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        {/* Do NOT put non-Screen children inside <Stack>. */}
        <Stack>
          {/* Only customize screens that actually exist */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="chat" />
          {/* index/explore/send will be auto-registered; customize if needed */}
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
