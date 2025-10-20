import { sendChatMessage } from "@/lib/api";
import { useAuth } from "@/lib/ctx";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/**
 * API'den gelen tek bir sohbet mesajının yapısını tanımlar
 */
type ChatMessage = {
  yazar_tamad: string;
  yazar_statu: "dr" | "mf";
  cht_datetime: string;
  cht_text: string;
};

/**
 * API yanıtının genel yapısı
 */
type ApiResponse = {
  status: string;
  data: ChatMessage[];
};

export default function ChatScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ name?: string; chatId?: string }>();

  const name = params.name ?? "Sohbet";
  const chatId = params.chatId ? Number(params.chatId) : undefined;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(""); // Kullanıcının yazdığı mesaj
  const [sending, setSending] = useState(false); // Mesaj gönderme durumu

  /**
   * Sohbet geçmişini API'den çeker (POST isteğiyle).
   */
  const fetchMessages = useCallback(async () => {
    if (!token || !chatId) {
      console.warn("Token veya chatId eksik, POST işlemi atlanıyor.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendChatMessage(token, chatId, "");

      if (!res) {
        console.warn("API null veya tanımsız bir yanıt döndürdü.");
        setError("API'den veri alınamadı.");
        setMessages([]);
        return;
      }

      console.log("API response:", res);

      // Format kontrolü
      if (typeof res === 'object' && res !== null && 'status' in res && 'data' in res && Array.isArray(res.data)) {
        const apiResponse = res as ApiResponse;
        const data = apiResponse.data;
        
        setMessages(data.slice().reverse());
      } else {
        console.warn("Geçersiz API yanıtı:", res);
        setError("API'den beklenen formatta veri alınamadı.");
        setMessages([]);
      }
    } catch (e: any) {
      console.error("API hatası:", e);
      setError(e?.message ?? "Mesajlar alınamadı.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, chatId]);

  // Ekran ilk açıldığında ve token/chatId değiştiğinde mesajları çeker
  useEffect(() => {
    if (chatId && token) fetchMessages();
  }, [chatId, token, fetchMessages]);

  /**
   * Kullanıcı ekranı aşağı çektiğinde mesaj listesini yeniler
   */
  const onRefresh = useCallback(async () => {
    if (!chatId || !token) return;
    setRefreshing(true);
    try {
      await fetchMessages();
    } finally {
      setRefreshing(false);
    }
  }, [chatId, token, fetchMessages]);

  // Gönder butonunun aktif olup olmayacağını belirler
  const canSend = useMemo(() => {
    return message.trim() !== "" && !sending;
  }, [message, sending]);

  /**
   * Yazılan mesajı API'ye gönderir (POST isteği ile).
   */
  const onSend = useCallback(async () => {
    if (!token || !chatId) {
      Alert.alert("Hata", "Giriş yapılmamış veya sohbet ID'si bulunamadı.");
      return;
    }

    try {
      setSending(true);
      const idNum = Number(chatId);
      if (!Number.isFinite(idNum) || idNum <= 0) {
        Alert.alert("Geçersiz hst_id", "Lütfen pozitif bir sayı girin.");
        return;
      }
      // Mesajı gönder
      await sendChatMessage(token, idNum, message);
      // Giriş alanını temizle
      setMessage("");
      // Mesaj gönderildikten sonra sohbet geçmişini yeniden çek
      await fetchMessages();
    } catch (e: any) {
      Alert.alert("Gönderme Hatası", e?.message ?? String(e));
    } finally {
      setSending(false);
    }
  }, [token, chatId, message, fetchMessages]);

  /**
   * Tarih/saati yerel saat formatına dönüştürür (ör: "14:30")
   */
  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateTimeString;
    }
  };

  const isEmpty = !loading && messages.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: name }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          {loading && messages.length === 0 ? (
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
              data={messages}
              keyExtractor={(item, index) => `${item.cht_datetime}-${index}`}
              style={styles.list}
              contentContainerStyle={styles.listContainer}
              inverted // Mesajların aşağıdan yukarıya doğru akmasını sağlar.
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

          {/* Mesaj Giriş Alanı */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Mesajınızı yazın..."
              multiline
            />
            <Button title={sending ? "Gönderiliyor..." : "Gönder"} onPress={onSend} disabled={!canSend} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Stil ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#E5DDD5" },
  list: { flex: 1 },
  listContainer: { paddingHorizontal: 10, paddingVertical: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 16, color: "#555", marginTop: 8 },
  errorText: { marginTop: 6, color: "#b00020" },
  messageRow: { flexDirection: "row", marginVertical: 4 },
  doctorRow: { justifyContent: "flex-end" }, // Doktor mesajları sağda
  mfRow: { justifyContent: "flex-start" }, // Diğerleri solda
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f9f9f9'
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
});