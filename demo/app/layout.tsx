import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habit Maker Demo",
  description: "External agent + onchain commitment demo for The Synthesis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

