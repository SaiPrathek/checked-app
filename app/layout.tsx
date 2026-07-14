import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { Nav } from "@/components/nav";
import { LogoMark } from "@/components/logo";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://checked.co.in"),
  title: {
    default: "Checked — pack smart for your move to the US",
    template: "%s · Checked",
  },
  applicationName: "Checked",
  description:
    "A relocation copilot for Indian students moving to the US. Personalized packing verdicts, a live luggage weigher, and community-backed guidance. Everything, checked.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Checked",
    title: "Checked — Everything, checked.",
    description: "Pack smarter for your move from India to the US.",
    images: [
      {
        url: "/brand/checked-social.png",
        width: 1200,
        height: 630,
        alt: "Checked — Everything, checked.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Checked — Everything, checked.",
    description: "Pack smarter for your move from India to the US.",
    images: ["/brand/checked-social.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1626",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
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
            <footer className="mx-auto flex max-w-[1120px] items-center justify-center gap-2 px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-mono-muted">
              <LogoMark className="h-5 w-5 flex-shrink-0" />
              <span>Checked · checked.co.in · v0 · verdicts sourced from The Hold — corpus/README.md</span>
            </footer>
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
