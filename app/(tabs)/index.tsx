import * as api from "@/lib/api";
import { useAuth } from "@/lib/ctx";
import { Feather } from "@expo/vector-icons"; // For icons
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Define the type for items in your list
type PendingItem = {
  hst_id: number;
  hst_durum?: number;
  hst_full_name?: string;
  kayit_date?: string;
};

// Helper function to get initials for the avatar
const getInitials = (name: string = "") => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export default function HomeScreen() {
  const { token, logout, isLoading: authLoading } = useAuth();

  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const isSending = (id: number) => sendingIds.has(id);

  const loadPending = useCallback(async () => {
    // ... (This function remains the same)
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setLoadingPending(true);
      const data = await api.getPending(token);
      const list: PendingItem[] = Array.isArray(data) ? data : data?.data ?? [];
      setPending(list);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (/401|403/.test(msg)) {
        Alert.alert("Session expired", "Please sign in again.");
        await logout();
        router.replace("/login");
        return;
      }
      Alert.alert("Load error", msg);
    } finally {
      setLoadingPending(false);
    }
  }, [token, authLoading, logout]);

  const openChat = useCallback(
    // ... (This function remains the same)
    async (item: PendingItem) => {
      if (!token) {
        router.replace("/login");
        return;
      }
      const { hst_id, hst_full_name } = item;
      try {
        setSendingIds(prev => new Set(prev).add(hst_id));
        const res = await api.sendChatMessage(token, hst_id);

        router.push({
          pathname: "/chat",
          params: {
            response: JSON.stringify(res),
            name: hst_full_name ?? "Chat Result",
          },
        });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        if (/401|403/.test(msg)) {
          Alert.alert("Session expired", "Please sign in again.");
          await logout();
          router.replace("/login");
          return;
        }
        Alert.alert("Send error", msg);
      } finally {
        setSendingIds(prev => {
          const next = new Set(prev);
          next.delete(hst_id);
          return next;
        });
      }
    },
    [token, logout]
  );

  useEffect(() => { loadPending(); }, [loadPending]);
  useFocusEffect(useCallback(() => { loadPending(); return () => {}; }, [loadPending]));

  // Filter conversations based on the search query
  const filteredPending = useMemo(() => {
    if (!searchQuery) return pending;
    return pending.filter(item =>
      item.hst_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pending, searchQuery]);

  // Format date for display (changed to en-GB locale)
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* --- Custom Header --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Feather name="log-out" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* --- Search Bar --- */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* --- Chat List --- */}
        <FlatList
          data={filteredPending}
          keyExtractor={(item) => String(item.hst_id)}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadPending}
          refreshing={loadingPending}
          ListEmptyComponent={
            !loadingPending ? <Text style={styles.emptyText}>No conversations found.</Text> : null
          }
          renderItem={({ item }) => {
            const sending = isSending(item.hst_id);
            return (
              <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)} disabled={sending}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(item.hst_full_name)}</Text>
                </View>
                <View style={styles.chatContent}>
                  <Text style={styles.chatName} numberOfLines={1}>{item.hst_full_name}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    ID: {item.hst_id} • Status: {item.hst_durum ?? "N/A"}
                  </Text>
                </View>
                <View style={styles.chatMeta}>
                  {sending ? (
                    <ActivityIndicator color="#007AFF" />
                  ) : (
                    <Text style={styles.timestamp}>{formatDate(item.kayit_date)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingTop: 16, // Added padding to the top
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