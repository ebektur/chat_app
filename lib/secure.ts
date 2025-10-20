import * as SecureStore from "expo-secure-store";

const KEY = "authToken";

export const isSecureStoreAvailable = SecureStore.isAvailableAsync;

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Failed to set secure item ${key}:`, error);
    throw error; // Re-throw to allow calling code to handle
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to get secure item ${key}:`, error);
    return null; // Or throw, depending on desired behavior
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Failed to delete secure item ${key}:`, error);
    throw error; // Re-throw to allow calling code to handle
  }
}

export const secure = {
  saveToken: (token: string) => setSecureItem(KEY, token),
  getToken: () => getSecureItem(KEY),
  clearToken: () => deleteSecureItem(KEY),
};