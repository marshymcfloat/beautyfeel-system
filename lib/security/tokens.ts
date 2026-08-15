import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env/server";

export function createGuestToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashGuestToken(raw) };
}

export function hashGuestToken(raw: string): string {
  return createHash("sha256")
    .update(`${getServerEnv().GUEST_TOKEN_PEPPER}:${raw}`)
    .digest("hex");
}

export function verifySecret(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createTemporaryPassword(): string {
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
  const vowels = "aeiou";
  const pick = (characters: string) => characters[randomInt(characters.length)];
  return `${pick(consonants)}${pick(vowels)}${pick(consonants).toLowerCase()}${pick(vowels)}${randomInt(1000, 10000)}`;
}

export function createPublicBookingCode(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `BF-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
