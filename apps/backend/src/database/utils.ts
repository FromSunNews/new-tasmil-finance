import { genSaltSync, hashSync } from "bcrypt-ts";

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateHashedPassword(password: string): string {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

export function generateDummyPassword(): string {
  return generateHashedPassword(generateUUID());
}
