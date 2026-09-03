import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, expectedKey] = String(storedHash).split(":");
  if (typeof password !== "string" || !salt || !/^[a-f0-9]{128}$/i.test(expectedKey)) return false;

  const actualKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualKey, "hex"), Buffer.from(expectedKey, "hex"));
}
