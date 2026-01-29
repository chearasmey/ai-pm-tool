import bcrypt from "bcryptjs";

export function generateDefaultPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";

  const all = upper + lower + digits + symbols;

  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

  // Ensure strong composition
  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);

  while (pwd.length < length) pwd += pick(all);

  // shuffle
  pwd = pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return pwd;
}

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);