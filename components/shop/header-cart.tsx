"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cartCount, cartSizeText, useCart } from "@/lib/shop/cart";
import "./header-cart.css";

/**
 * The basket in the site header, on every page, once something is in it: the way back to the basket from
 * the home page, the Atelier or the contact page. (On wide screens it replaces the floating shop button.)
 */
export function HeaderCart() {
  const lines = useCart();
  const pathname = usePathname();
  const count = cartCount(lines);
  if (count === 0) return null;
  const here = pathname === "/magazin/cos";
  return (
    <Link
      href="/magazin/cos"
      className="header-cart"
      aria-label={`Coșul tău: ${cartSizeText(lines.length, count)}`}
      aria-current={here ? "page" : undefined}
    >
      <ShoppingBag size={20} aria-hidden="true" />
      <span className="header-cart__count" aria-hidden="true">
        {count}
      </span>
    </Link>
  );
}
