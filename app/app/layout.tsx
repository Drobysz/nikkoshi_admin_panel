import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nikkoshi Admin Panel",
  description: "Admin panel for managing Nikkoshi articles and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
