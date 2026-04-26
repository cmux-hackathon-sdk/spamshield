import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpamShield — Real-Time Scam Intelligence",
  description: "Global scam threat intelligence console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%", overflow: "hidden" }}>
      <body className={inter.className} style={{ height: "100%", overflow: "hidden", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
