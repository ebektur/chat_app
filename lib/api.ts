import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from "react-native";

// API'nin temel adresi. Geliştirme sırasında bilgisayarınızın yerel IP adresini kullanın.
const API_BASE = "http://172.20.10.4:8000/api";
const DEBUG = true;

// Giriş yanıtından gelebilecek çeşitli token anahtarlarını tanımlar.
type LoginResp = { token?: string; api_key?: string; access_token?: string; [k: string]: any; };
// Yanıt nesnesinden doğru token'ı seçer.
const pickToken = (j: LoginResp) => j.token ?? j.api_key ?? j.access_token ?? null;

/**
 * API yanıtını güvenli bir şekilde JSON olarak ayrıştırmaya çalışır.
 * Ayrıştırma başarısız olursa, json metni döndürür.
 */
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try { return { json: JSON.parse(text), text }; } catch { return { json: null, text }; }
}

/**
 * API'ye genel bir istek göndermek için kullanılan merkezi fonksiyon.
 */
async function request(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (!headers["Content-Type"] && opts.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...opts, headers });
  const { json, text } = await parseJsonSafe(res);

  // Hata ayıklama modunda istek ve yanıt detaylarını konsola yazdırır.
  DEBUG && console.log(`${opts.method ?? "GET"} ${path} ->`, res.status, text.slice(0, 300));
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${path} isteği başarısız oldu (${res.status}): ${text}`);
  return json ?? text;
}

/**
 * Kullanıcı girişi yapar ve bir yetkilendirme token'ı alır.
 * @param email Kullanıcının e-posta adresi.
 * @param password Kullanıcının şifresi.
 * @returns Başarılı olursa bir yetkilendirme token'ı.
 */
export async function login(email: string, password: string) {
  const body = JSON.stringify({ email, password });
  const data = await request("/login", { method: "POST", body });
  const token = pickToken(data);
  if (!token) throw new Error("Giriş yanıtında token bulunamadı");
  return token;
}

/**
 * Bekleyen görüşmelerin listesini alır.
 * @param token Yetkilendirme token'ı.
 */
export async function getPending(token: string) {
  return request("/cevap-bekleyenler", { method: "GET" }, token);
}

/**
 * Belirli bir sohbetin mesaj geçmişini alır.
 * @param token Yetkilendirme token'ı.
 * @param hst_id Sohbetin hasta ID'si.
 */
export async function getChatMessages(token: string, hst_id: number) {
  return request(`/chat-messages?hst_id=${hst_id}`, { method: "GET" }, token);
}

/**
 * Bir sohbete yeni bir mesaj gönderir.
 * @param token Yetkilendirme token'ı.
 * @param hst_id Sohbetin hasta ID'si.
 * @param message Gönderilecek mesaj metni.
 */
export async function sendChatMessage(token: string, hst_id: number, message: string) {
    const body = JSON.stringify({ hst_id, message });
    return request("/chat-messages", { method: "POST", body }, token);
}

/**
 * Anlık bildirimler için cihazı kaydeder ve bir Expo Push Token alır.
 * @returns Bir Expo Push Token veya izin verilmezse null.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  if (!projectId) {
    console.warn('app.json -> extra.eas.projectId içinde EAS projectId eksik');
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/**
 * Alınan Expo Push Token'ı backend sunucusuna gönderir.
 * @param authToken Kullanıcının yetkilendirme token'ı.
 * @param expoToken Cihazın Expo Push Token'ı.
 */
export async function sendPushTokenToServer(authToken: string, expoToken: string) {
  const body = JSON.stringify({ token: expoToken, device: Platform.OS });
  return request("/save-push-token", { method: "POST", body }, authToken);
}

export default {
  login,
  getPending,
  getChatMessages,
  sendChatMessage,
  registerForPushNotificationsAsync,
  sendPushTokenToServer,
};