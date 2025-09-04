/** @format */
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as Encoding from "text-encoding"; // Import for TextEncoder/Decoder

interface SecureStorageOptions {
	expiration?: Date;
	encrypt?: boolean;
}

const DEFAULT_ENCRYPTION_KEY_NAME = "82kedC1LibAGXyt+k9GoT3LgxrSh2eXDj3ssTZqPDnw=";

// Helper function to generate or retrieve an encryption key
async function getEncryptionKey(): Promise<string> {
	try {
		let key = await SecureStore.getItemAsync(DEFAULT_ENCRYPTION_KEY_NAME);
		if (!key) {
			key = await Crypto.digestStringAsync(
				Crypto.CryptoDigestAlgorithm.SHA256,
				Math.random().toString(), // Generate a random key
			);
			await SecureStore.setItemAsync(DEFAULT_ENCRYPTION_KEY_NAME, key);
		}
		return key;
	} catch (error) {
		console.error("Error getting/generating encryption key:", error);
		throw new Error("Failed to get encryption key."); // Re-throw for handling upstream
	}
}

// Helper functions for encryption/decryption
async function encryptData(data: string): Promise<string> {
	try {
		const key = await getEncryptionKey();
		const iv = await Crypto.generateRandom(16); // Initialization Vector
		const ivString = Array.from(iv, (byte: any) => String.fromCharCode(byte)).join(""); // Convert Uint8Array to string

		const cryptoResult = await Crypto.encryptAsync(
			{
				data: data,
				key: key,
				iv: ivString,
			},
			{
				algorithm: Crypto.CryptoAlgorithm.AES256,
				encoding: Crypto.CryptoEncoding.BASE64,
			},
		);

		return JSON.stringify({ iv: ivString, data: cryptoResult }); // Store IV with encrypted data
	} catch (error) {
		console.error("Encryption error:", error);
		throw new Error("Failed to encrypt data.");
	}
}

async function decryptData(encryptedData: string): Promise<string> {
	try {
		const key = await getEncryptionKey();
		const parsedData = JSON.parse(encryptedData);
		const iv = parsedData.iv;
		const data = parsedData.data;

		const decryptedData = await Crypto.decryptAsync(
			{
				data: data,
				key: key,
				iv: iv,
			},
			{
				algorithm: Crypto.CryptoAlgorithm.AES256,
				encoding: Crypto.CryptoEncoding.BASE64,
			},
		);

		return decryptedData;
	} catch (error) {
		console.error("Decryption error:", error);
		throw new Error("Failed to decrypt data.");
	}
}

// Save secure data
export const saveSecure = async (key: string, value: string, options: SecureStorageOptions = {}): Promise<void> => {
	const { expiration, encrypt = false } = options;

	let dataToStore = value;

	if (encrypt) {
		dataToStore = await encryptData(value);
	}

	if (expiration) {
		const expirationTimestamp = expiration.getTime();
		dataToStore = JSON.stringify({ value: dataToStore, expiration: expirationTimestamp });
	}

	try {
		await SecureStore.setItemAsync(key, dataToStore);
	} catch (error) {
		console.error("Error saving secure data:", error);
		throw new Error("Failed to save secure data."); // Re-throw for handling upstream
	}
};

// Retrieve secure data
export const getSecure = async (key: string, options: SecureStorageOptions = {}): Promise<string | null> => {
	const { encrypt = false } = options;

	try {
		const storedData = await SecureStore.getItemAsync(key);

		if (!storedData) {
			return null;
		}

		let parsedData;
		try {
			parsedData = JSON.parse(storedData);
		} catch (e) {
			// If it's not JSON, assume it's a plain string (backward compatibility)
			parsedData = { value: storedData, expiration: null };
		}

		const { value, expiration } = parsedData;

		if (expiration && new Date().getTime() > expiration) {
			// Data has expired, delete it
			await deleteSecure(key);
			return null;
		}

		let decryptedValue = value;
		if (encrypt) {
			decryptedValue = await decryptData(value);
		}

		return decryptedValue;
	} catch (error) {
		console.error("Error retrieving secure data:", error);
		return null; // Or throw an error, depending on your needs
	}
};

// Delete secure data
export const deleteSecure = async (key: string): Promise<void> => {
	try {
		await SecureStore.deleteItemAsync(key);
	} catch (error) {
		console.error("Error deleting secure data:", error);
	}
};
