import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { LogoMark } from "@/components/logo";
import { SyncBanner } from "@/components/sync-banner";
import { ConsentBanner } from "@/components/consent-banner";

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
    "A relocation copilot for Indian students moving to the US — personalized packing verdicts, a live luggage weigher, and guidance built from students who've made the move.",
  alternates: { canonical: "/" },
  keywords: [
    "packing list for US",
    "Indian students USA",
    "study abroad packing",
    "luggage weight calculator",
    "what to pack for US masters",
    "F-1 student relocation",
    "bring vs buy USA",
  ],
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
    description:
      "Pack smarter for your move from India to the US — bring-vs-buy verdicts and a live luggage weigher.",
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
    description:
      "Pack smarter for your move from India to the US — bring-vs-buy verdicts and a live luggage weigher.",
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
            <footer className="mx-auto flex max-w-[1120px] flex-col items-center justify-center gap-2 px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-mono-muted">
              <span className="flex items-center gap-2">
                <LogoMark className="h-5 w-5 flex-shrink-0" />
                Checked · checked.co.in · v0 · verdicts sourced from The Hold — corpus/README.md
              </span>
              <span className="max-w-[560px] normal-case tracking-normal text-[10.5px] text-[#a79e8b]">
                Some &ldquo;buy in the US&rdquo; links may earn us a commission —
                verdicts reflect community data and item facts alone, and
                commissions never influence them.
              </span>
              <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 normal-case tracking-normal text-[10.5px]">
                <Link href="/guides" className="text-[#a79e8b] hover:text-primary">
                  Guides
                </Link>
                <span aria-hidden className="text-[#d8cdb8]">·</span>
                <Link href="/privacy" className="text-[#a79e8b] hover:text-primary">
                  Privacy
                </Link>
                <span aria-hidden className="text-[#d8cdb8]">·</span>
                <Link href="/terms" className="text-[#a79e8b] hover:text-primary">
                  Terms
                </Link>
                <span aria-hidden className="text-[#d8cdb8]">·</span>
                <Link href="/disclosure" className="text-[#a79e8b] hover:text-primary">
                  Affiliate Disclosure
                </Link>
              </nav>
            </footer>
            <SyncBanner />
            <ConsentBanner />
          </AppProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
