// lib/api.ts

const REALSERVER = 'https://care.medicalfly.com.tr/api'; 
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from "react-native";

// Local mock server addresses
const HOST_ANDROID_EMU = "http://10.0.2.2:8000";   // Android emulator -> host
const HOST_IOS_SIM     = "http://127.0.0.1:8000";  // iOS simulator -> host
const HOST_DEVICE_LAN  = "http://192.168.1.42:8000"; // <- replace with your machine LAN IP if testing on device

// Decide API host based on platform
const API_HOST =
  Platform.OS === "android" ? HOST_ANDROID_EMU
  : __DEV__ ? HOST_IOS_SIM
  : HOST_DEVICE_LAN;

// Final base URL
//const API_BASE = `${API_HOST}/api`;
const API_BASE = "http://192.168.0.253:8000/api";

const DEBUG = true;

console.log("📡 API_BASE:", API_BASE);

// --- Helpers ---

type LoginResp = { token?: string; api_key?: string; access_token?: string; [k: string]: any; };
const pickToken = (j: LoginResp) => j.token ?? j.api_key ?? j.access_token ?? null;

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try { return { json: JSON.parse(text), text }; } catch { return { json: null, text }; }
}

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

  DEBUG && console.log(`${opts.method ?? "GET"} ${path} ->`, res.status, text.slice(0, 300));
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${path} failed (${res.status}): ${text}`);
  return json ?? text;
}

// --- Public API ---

export async function login(email: string, password: string) {
  const body = JSON.stringify({ email, password });
  const data = await request("/login", { method: "POST", body });
  const token = pickToken(data);
  if (!token) throw new Error("No token found in login response");
  return token;
}

export async function getPending(token: string) {
  return request("/cevap-bekleyenler", { method: "GET" }, token);
}

export async function getChatMessages(token: string, hst_id: number) {
  const body = JSON.stringify({ hst_id });
  return request("/chat-messages", { method: "POST", body }, token);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
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
    console.warn('Missing EAS projectId in app.json -> extra.eas.projectId');
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data; // "ExponentPushToken[...]" or "ExpoPushToken[...]"
}

export async function sendPushTokenToServer(authToken: string, expoToken: string) {
  const body = JSON.stringify({ token: expoToken, device: Platform.OS });
  return request("/save-push-token", { method: "POST", body }, authToken); // ← use /save-push-token
}

// Alias so you can call api.sendChatMessage(...) as well
export const sendChatMessage = getChatMessages;

// Default export includes both
export default { login, getPending, getChatMessages, sendChatMessage, registerForPushNotificationsAsync, sendPushTokenToServer};