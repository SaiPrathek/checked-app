import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Tower — ask anything about moving to the US",
  description:
    "Ask The Tower anything about relocating from India to the US — customs, winter gear, kitchen kit, what to bring vs buy — grounded in community-backed data from The Hold.",
  alternates: { canonical: "/the-tower" },
  openGraph: {
    type: "website",
    url: "/the-tower",
    title: "The Tower — ask anything about moving to the US",
    description:
      "Community-grounded answers for Indian students relocating to the US: customs, winter gear, kitchen kit, bring-vs-buy, and more.",
  },
};

export default function TowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
