import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Master encryption key derived from environment or securely generated once and stored in tmp
function getMasterKey(): Buffer {
  if (process.env.KALALO_SECRET_KEY && process.env.KALALO_SECRET_KEY.length >= 32) {
    return crypto.createHash("sha256").update(process.env.KALALO_SECRET_KEY).digest();
  }

  const baseDir = process.env.VERCEL ? "/tmp" : process.cwd();
  const keyPath = path.resolve(baseDir, "tmp", ".encryption_master_key");
  try {
    if (fs.existsSync(keyPath)) {
      const saved = fs.readFileSync(keyPath, "utf-8").trim();
      if (saved.length === 64) {
        return Buffer.from(saved, "hex");
      }
    }
  } catch {}

  // Generate and persist stable local master key
  const newKey = crypto.randomBytes(32);
  try {
    const tmpDir = path.dirname(keyPath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(keyPath, newKey.toString("hex"), "utf-8");
  } catch {}

  return newKey;
}

/**
 * Encrypts a plaintext string (e.g. API key) using AES-256-GCM.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText || plainText.trim().length === 0) return "";
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let encrypted = cipher.update(plainText, "utf-8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Output format: iv:authTag:encryptedCiphertext
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload || !encryptedPayload.includes(":")) return "";
  try {
    const [ivHex, authTagHex, cipherHex] = encryptedPayload.split(":");
    if (!ivHex || !authTagHex || !cipherHex) return "";

    const masterKey = getMasterKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch {
    // If decryption fails (e.g. key changed or corrupt), safely return empty string
    return "";
  }
}
