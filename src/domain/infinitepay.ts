/**
 * Checkout addresses explicitly accepted for Brazilian InfinitePay redirects.
 * Only exact HTTPS hostnames; do not accept attacker-owned suffixes or credentials.
 */
export const CHECKOUT_HOSTS = Object.freeze([
 "checkout.infinitepay.com.br",
 "checkout.infinitepay.io",
 "buy.infinitepay.io"
]);
export type PaymentCheck = {success?: unknown;paid?: unknown;amount?: unknown};
export function verifiedPaymentAmount(result:unknown, expectedCents:number):boolean {
 if(!result || typeof result!=="object")return false;
 const x=result as PaymentCheck;
 return x.success===true && x.paid===true &&
   Number.isSafeInteger(expectedCents) && expectedCents>=100 &&
   x.amount===expectedCents;
}
export function isTrustedCheckoutUrl(candidate: string): boolean {
 try {
  const url = new URL(candidate);
  return url.protocol === "https:" &&
    CHECKOUT_HOSTS.includes(url.hostname) &&
    !url.username && !url.password &&
    (!url.port || url.port === "443");
 } catch {
  return false;
 }
}
