/**
 * ATPCursos discounts: 2nd COMPLETED ORDER gets 20%, 3rd 30%, 4th 40%, 5th+ 50%.
 * Related add-on within the FIRST basket earns 10%; discounts never stack.
 * All values are integer BRL cents, never trust a price submitted by the client.
 */
export type ProductPrice = { id: string; priceCents: number };
export type PriceQuote = {
  completedOrders: number; itemCount: number; fullCents: number;
  ratePercent: number; discountCents: number; totalCents: number; label: string;
};
export function loyaltyPercent(completedOrders: number): number {
  if (!Number.isSafeInteger(completedOrders) || completedOrders < 0)
    throw new Error("invalid completedOrders");
  if (completedOrders === 0) return 0;
  return Math.min(50, 20 + 10 * (completedOrders - 1));
}
export function quotePrice(products: ProductPrice[], completedOrders: number): PriceQuote {
  if (!Array.isArray(products) || !products.length || products.length > 20)
    throw new Error("cart size invalid");
  const ids = new Set<string>();
  let fullCents = 0;
  for (const p of products) {
    if (!p || !p.id || ids.has(p.id) || !Number.isSafeInteger(p.priceCents)
      || p.priceCents < 100 || p.priceCents > 20000000) throw new Error("product invalid");
    ids.add(p.id);
    fullCents += p.priceCents;
  }
  if (!Number.isSafeInteger(fullCents)) throw new Error("overflow");
  const loyalty = loyaltyPercent(completedOrders);
  const crossSell = products.length > 1 ? 10 : 0;
  const ratePercent = Math.min(50, Math.max(loyalty, crossSell));
  const discountCents = Math.min(Math.floor(fullCents / 2), Math.floor(fullCents * ratePercent / 100));
  const totalCents = fullCents - discountCents;
  return { completedOrders, itemCount: products.length, fullCents, ratePercent, discountCents, totalCents,
    label: loyalty >= crossSell && loyalty > 0 ? "fidelidade" : crossSell ? "compre-junto" : "sem-desconto" };
}
