import { getChatMessages } from "@/lib/api";
import { useAuth } from "@/lib/ctx";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from "react-native";

// Types for a single chat message from your API
type ChatMessage = {
  yazar_tamad: string;
  yazar_statu: "dr" | "mf";
  cht_datetime: string;
  cht_text: string;
};

type ApiResponse = {
  status: string;
  data: ChatMessage[];
};

export default function ChatScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ response?: string; name?: string; chatId?: string }>();

  const name = params.name ?? "Chat Conversation";
  const chatId = params.chatId ? Number(params.chatId) : undefined;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fallback: support legacy `response` param (mocked payloads)
  const messagesFromResponse = useMemo<ChatMessage[]>(() => {
    if (!params.response) return [];
    try {
      const j: ApiResponse = JSON.parse(params.response);
      if (j && Array.isArray(j.data)) {
        return j.data.slice().reverse();
      }
    } catch (e) {
      console.warn("Failed to parse response JSON:", e);
    }
    return [];
  }, [params.response]);

  // Fetch from API when we have a chatId and token
  const fetchMessages = useCallback(async () => {
    if (!token || !chatId) return;
    setError(null);
    setLoading(true);
    try {
      const res = (await getChatMessages(token, chatId)) as ApiResponse;
      const data = Array.isArray(res?.data) ? res.data : [];
      setMessages(data.slice().reverse());
    } catch (e: any) {
      setError(e?.message ?? "Mesajlar alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [token, chatId]);

  useEffect(() => {
    if (chatId && token) fetchMessages();
  }, [chatId, token, fetchMessages]);

  const onRefresh = useCallback(async () => {
    if (!chatId || !token) return;
    setRefreshing(true);
    try {
      await fetchMessages();
    } finally {
      setRefreshing(false);
    }
  }, [chatId, token, fetchMessages]);

  const data = chatId ? messages : messagesFromResponse;

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateTimeString;
    }
  };

  const isEmpty = !loading && data.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: name }} />

      {loading && data.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Bu sohbet için mesaj yok.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.cht_datetime}-${index}`}
          style={styles.list}
          contentContainerStyle={styles.listContainer}
          inverted
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isDoctor = item.yazar_statu === "dr";
            return (
              <View style={[styles.messageRow, isDoctor ? styles.doctorRow : styles.mfRow]}>
                <View style={[styles.messageBubble, isDoctor ? styles.doctorBubble : styles.mfBubble]}>
                  <Text style={styles.authorText}>{item.yazar_tamad}</Text>
                  <Text style={styles.messageText}>{item.cht_text}</Text>
                  <Text style={styles.timeText}>{formatDateTime(item.cht_datetime)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#E5DDD5" },
  list: { flex: 1 },
  listContainer: { paddingHorizontal: 10, paddingVertical: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 16, color: "#555", marginTop: 8 },
  errorText: { marginTop: 6, color: "#b00020" },
  messageRow: { flexDirection: "row", marginVertical: 4 },
  doctorRow: { justifyContent: "flex-end" },
  mfRow: { justifyContent: "flex-start" },
  messageBubble: {
    maxWidth: "85%",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  doctorBubble: { backgroundColor: "#DCF8C6", borderBottomRightRadius: 2 },
  mfBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 2 },
  authorText: { fontWeight: "bold", marginBottom: 4, color: "#075E54" },
  messageText: { fontSize: 16, color: "#111" },
  timeText: { fontSize: 11, color: "#A0A0A0", textAlign: "right", marginTop: 5, marginLeft: 10 },
});
