"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/lib/shop/cart";

/** Floating basket button on the shop pages, once something is in the basket. */
export function CartFab() {
  const lines = useCart();
  const pathname = usePathname();
  const count = cartCount(lines);
  if (count === 0 || pathname === "/magazin/cos") return null;
  return (
    <Link href="/magazin/cos" className="shop-fab" aria-label={`Coșul tău: ${count} ${count === 1 ? "produs" : "produse"}`}>
      <ShoppingBag size={20} aria-hidden="true" />
      <span>Coș</span>
      <span className="shop-fab__count">{count}</span>
    </Link>
  );
}
