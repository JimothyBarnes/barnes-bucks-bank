import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barnes Bucks Bank",
  description: "A family banking app for balances, jobs, and rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
