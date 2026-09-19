import type { Metadata } from "next";
import { Caveat, Instrument_Sans, Syne } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const caveat    = Caveat    ({ subsets: ["latin"], weight: ["400","700"], variable: "--font-caveat",    display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-instrument", display: "swap" });
const syne      = Syne      ({ subsets: ["latin"], weight: ["400","500","600","700","800"], variable: "--font-syne",      display: "swap" });

export const metadata: Metadata = {
  title: { default: "Lumora — Trade with clarity", template: "%s · Lumora" },
  description: "Lumora — Built in Kenya. Made for Africa. Markets, simplified.",
  applicationName: "Lumora",
  icons: {
    icon:   [{ url: "/icon.png",         type: "image/png", sizes: "any" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Lumora — Trade with clarity",
    description: "Markets, simplified.",
    images: ["/chatgpt-hero.png"],
    siteName: "Lumora",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${instrument.variable} ${syne.variable}`}>
      <body className="font-sans antialiased bg-bg-950 text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
