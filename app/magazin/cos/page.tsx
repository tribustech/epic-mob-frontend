import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = {
  title: { absolute: "Coșul tău | Magazin EpicMob" },
  robots: { index: false },
  alternates: { canonical: "/magazin/cos" },
};

export default function CartPage() {
  return (
    <main className="home-warm shop-page">
      <div className="section-shell shop-cart-shell">
        <CartView />
      </div>
    </main>
  );
}
