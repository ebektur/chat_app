// app/(tabs)/send.tsx
import { sendChatMessage } from "@/lib/api";
import { getToken } from "@/lib/secure";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function SendChatScreen() {
  const params = useLocalSearchParams<{ hst_id?: string }>();
  const [hstId, setHstId] = useState(params?.hst_id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const canSend = useMemo(() => {
    const n = Number(hstId);
    return Number.isFinite(n) && n > 0 && !loading;
  }, [hstId, loading]);

  const onSend = async () => {
    try {
      setLoading(true);
      setResult(null);

      const token = await getToken();
      if (!token) {
        Alert.alert("Not logged in", "Please sign in first.");
        return;
      }

      const idNum = Number(hstId);
      if (!Number.isFinite(idNum) || idNum <= 0) {
        Alert.alert("Invalid hst_id", "Enter a positive number.");
        return;
      }

      const res = await sendChatMessage(token, idNum);
      setResult(res);
      Alert.alert("Success", "Message queued/sent.");
    } catch (e: any) {
      Alert.alert("Send error", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  // if this screen is opened from a push with data.hst_id, prefill
  useEffect(() => {
    if (params?.hst_id) setHstId(String(params.hst_id));
  }, [params?.hst_id]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Send chat-messages</Text>

        <Text style={styles.label}>hst_id</Text>
        <TextInput
          keyboardType="number-pad"
          value={hstId}
          onChangeText={setHstId}
          placeholder="e.g. 1234"
          style={styles.input}
        />

        <Button title={loading ? "Sending..." : "Send"} onPress={onSend} disabled={!canSend} />

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Contacting server…</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Server response</Text>
            <Text selectable style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  label: { fontSize: 14, opacity: 0.8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12 },
  loading: { marginTop: 12, alignItems: "center" },
  resultBox: { marginTop: 16, borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 12 },
  resultTitle: { fontWeight: "600", marginBottom: 6 },
  resultText: { fontFamily: Platform.select({ ios: "Courier", android: "monospace" }) },
});
