import "@/components/shop/shop.css";
import { CartFab } from "@/components/shop/cart-fab";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartFab />
    </>
  );
}
