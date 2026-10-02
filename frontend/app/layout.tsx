import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lead Qualifier",
  description: "AI-powered B2B lead qualification. Score, tier, and recommended action in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
