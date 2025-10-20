import api from "@/lib/api";
import { secure } from "@/lib/secure";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

const { saveToken } = secure;

/**
 * Kullanıcıların uygulamaya giriş yapmasını sağlayan ekran.
 */
const LoginScreen = () => {
  // State'ler kullanıcı adı, şifre ve yükleme durumunu yönetir.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Kullanıcı adı ve şifre ile API'ye giriş isteği gönderir.
   * Başarılı olursa, token'ı kaydeder ve ana ekrana yönlendirir.
   */
  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Giriş yapma deneniyor...");
      const token = await api.login(username, password);
      console.log("Giriş başarılı, token:", token);
      await saveToken(token);
      router.replace("/"); // Ana sayfaya yönlendir
    } catch (e: any) {
      console.error("Giriş başarısız:", e);
      Alert.alert("Giriş Başarısız", e.message || "Geçersiz kimlik bilgileri.");
    } finally {
      setIsLoading(false);
      console.log("Giriş işlemi tamamlandı, isLoading:", isLoading);
    }
  }, [username, password, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoş Geldiniz</Text>
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        onPress={handleLogin}
        disabled={isLoading}
      />

      {isLoading && (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 16 }} />
      )}
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