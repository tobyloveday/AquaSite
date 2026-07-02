import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AquaSite",
  description: "Site progress photo capture for civil & water infrastructure projects",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0891b2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
