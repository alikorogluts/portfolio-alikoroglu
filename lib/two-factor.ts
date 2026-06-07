import "server-only";

import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_PREFIX = "v1";

function getEncryptionKey() {
  const rawKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;

  if (!rawKey || rawKey.length < 32) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be set and at least 32 characters long.");
  }

  return createHash("sha256").update(rawKey).digest();
}

export function encryptTwoFactorSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [ENCRYPTION_PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(
    ":",
  );
}

export function decryptTwoFactorSecret(encryptedSecret: string) {
  const [prefix, iv, tag, encrypted] = encryptedSecret.split(":");

  if (prefix !== ENCRYPTION_PREFIX || !iv || !tag || !encrypted) {
    throw new Error("Invalid encrypted 2FA secret format.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createTwoFactorSecret(email: string) {
  const secret = generateSecret();
  const issuer = "Ali Koroglu Portfolio";
  const otpauthUrl = generateURI({
    issuer,
    label: email,
    secret,
  });

  return { secret, otpauthUrl };
}

export async function createQrCodeDataUrl(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
  });
}

export async function verifyTotpToken(token: string, encryptedSecret: string) {
  const secret = decryptTwoFactorSecret(encryptedSecret);

  const result = await verify({
    token: token.trim(),
    secret,
  });

  return result.valid;
}

export function createBackupCode() {
  const raw = randomBytes(6).toString("hex").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function normalizeBackupCode(code: string) {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export async function hashBackupCode(code: string) {
  return bcrypt.hash(normalizeBackupCode(code), 12);
}

export async function compareBackupCode(code: string, codeHash: string) {
  return bcrypt.compare(normalizeBackupCode(code), codeHash);
}
