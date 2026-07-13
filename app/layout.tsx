import type { Metadata } from "next";
import { Space_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { Nav } from "@/components/nav";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Checked — pack smart for your move to the US",
  description:
    "A relocation copilot for Indian students moving to the US. Personalized packing verdicts, a live luggage weigher, and community-backed guidance. Everything, checked.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="bg-paper text-ink">
        <AppProvider>
          <Nav />
          <main className="mx-auto max-w-[1120px] px-5 pb-20 pt-7">
            {children}
          </main>
          <footer className="mx-auto max-w-[1120px] px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-mono-muted">
            Checked · v0 · verdicts sourced from The Hold — corpus/README.md
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
