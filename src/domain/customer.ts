export type AccountAction = "password_reset" | "email_change";
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}
export function validEmail(value: string): boolean {
  const e = normalizeEmail(value);
  return e.length <= 254 && e.length >= 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
export function validName(value: string): boolean {
  return value.trim().length >= 2 && value.trim().length <= 120 && !/[\u0000-\u001f<>]/.test(value);
}
export function validPassword(value: string): boolean {
  return value.length >= 12 && value.length <= 128;
}
export function validCourtesyExpiry(expiry: number | null, current: number): boolean {
  return expiry === null || (Number.isSafeInteger(expiry) && expiry > current && expiry <= current + 366 * 86400);
}
export function newSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(x => x.toString(16).padStart(2, "0")).join("");
}
export async function secretHash(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, "0")).join("");
}
export const PBKDF2_ITERATIONS = 310000;
export async function passwordHash(password: string): Promise<{ digest: string; salt: string; iterations: number }> {
  if (!validPassword(password)) throw new Error("Password must contain 12 to 128 characters");
  const salt = newSecret();
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations:PBKDF2_ITERATIONS },key,256);
  const digest = Array.from(new Uint8Array(derived)).map(x=>x.toString(16).padStart(2,"0")).join("");
  return { digest, salt, iterations:PBKDF2_ITERATIONS };
}
export async function passwordMatch(password: string, salt: string, expected: string, iterations: number): Promise<boolean> {
  if (!validPassword(password) || !/^[0-9a-f]{64}$/.test(salt) || !/^[0-9a-f]{64}$/.test(expected) || iterations !== PBKDF2_ITERATIONS) return false;
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations},key,256));
  const exp = Uint8Array.from(expected.match(/../g)!.map(x=>parseInt(x,16)));
  let diff = 0; for(let i=0;i<32;i++)diff|=bits[i]^exp[i];
  return diff===0;
}
