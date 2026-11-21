import type { Metadata } from "next";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: { absolute: "Admin | EpicMob" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main className="adm-page">{children}</main>;
}
