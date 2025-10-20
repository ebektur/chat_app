import * as api from "@/lib/api";
import { useAuth } from "@/lib/ctx";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * `/cevap-bekleyenler` API uç noktasından alınan tek bir chat
 * öğesinin yapısını tanımlar.
 */
type PendingItem = {
  hst_id: number;
  patient_name: string;
  last_message_text: string;
  last_message_time: string;
  is_unread: number;
};

/**
 * Avatar için tam isimden baş harfleri oluşturan yardımcı fonksiyon.
 * @param {string} name - Hastanın tam adı.
 * @returns {string} Büyük harflerle baş harfler (örneğin, "Ayse Yilmaz" için "AY").
 */
const getInitials = (name: string = "") => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Uygulamanın ana ekranı, bekleyen hasta görüşmelerinin bir listesini gösterir
 */
export default function HomeScreen() {
  // Kullanıcı token'ına ve çıkış fonksiyonuna erişim için kimlik doğrulama
  const { token, logout, isLoading: authLoading } = useAuth();

  // API'den alınan bekleyen görüşmelerin listesini tutan state
  const [pending, setPending] = useState<PendingItem[]>([]);
  // Liste için yükleme göstergesini yöneten state
  const [loadingPending, setLoadingPending] = useState(false);
  // Arama giriş alanındaki mevcut metni tutan state
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * API'den bekleyen görüşmelerin listesini çeker
   * Yükleme durumunu ve olası kimlik doğrulama hatalarını yönetir
   */
  const loadPending = useCallback(async () => {
    if (authLoading || !token) return;
    
    try {
      setLoadingPending(true);
      const response = await api.getPending(token);
      const list: PendingItem[] = response?.data ?? [];
      setPending(list);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      // Oturum süresi dolmuşsa, kullanıcıyı çıkış yapmaya yönlendir.
      if (/401|403/.test(msg)) {
        Alert.alert("Oturum Süresi Doldu", "Lütfen tekrar giriş yapın.");
        await logout();
        router.replace("/login");
      } else {
        Alert.alert("Yükleme Hatası", msg);
      }
    } finally {
      setLoadingPending(false);
    }
  }, [token, authLoading, logout]);

  /**
   * Seçilen bir hasta için sohbet ekranına yönlendirir
   * @param {PendingItem} item - Seçilen görüşme 
   */
  const openChat = useCallback(
    (item: PendingItem) => {
      if (!token) {
        router.replace("/login");
        return;
      }
      // Hastanın ID'sini ve adını parametre olarak geçirerek sohbet ekranına yönlendir
      router.push({
        pathname: "/chat",
        params: {
          chatId: String(item.hst_id),
          name: item.patient_name,
        },
      });
    },
    [token, router]
  );

  // Görüşme listesinin her zaman güncel olmasını sağlar
  useFocusEffect(useCallback(() => { loadPending(); }, [loadPending]));

  /**
   * Chat araması yapmak için.
   */
  const filteredPending = useMemo(() => {
    if (!searchQuery) return pending;
    return pending.filter(item =>
      item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pending, searchQuery]);

  /**
   * Tarihi "15:50" formatına dönüştürür.
   * @param {string} dateString 
   * @returns {string} 
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* --- Özel Başlık --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Feather name="log-out" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* --- Arama Çubuğu --- */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Hasta adına göre ara"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* --- Sohbet Listesi --- */}
        <FlatList
          data={filteredPending}
          keyExtractor={(item) => String(item.hst_id)}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadPending}
          refreshing={loadingPending}
          ListEmptyComponent={
            !loadingPending ? <Text style={styles.emptyText}>Görüşme bulunamadı.</Text> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.patient_name)}</Text>
              </View>
              <View style={styles.chatContent}>
                <Text style={styles.chatName} numberOfLines={1}>{item.patient_name}</Text>
                {/* Bağlam için son mesaj metnini göster. */}
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message_text}
                </Text>
              </View>
              <View style={styles.chatMeta}>
                <Text style={styles.timestamp}>{formatDate(item.last_message_time)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Stil ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 15,
    color: '#555',
  },
  chatMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  timestamp: {
    fontSize: 14,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#8E8E93',
  },
});