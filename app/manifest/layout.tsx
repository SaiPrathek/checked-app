import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Manifest — your personalized packing list",
  description:
    "Your packing list with a clear verdict on every item — bring, buy, either, or skip — and the reasoning behind each call, tuned to your move from India to the US.",
  alternates: { canonical: "/manifest" },
  robots: { index: false, follow: true },
};

export default function ManifestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
