import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check-In — build your relocation profile",
  description:
    "A quick, conversational profile — school, city, intake and housing — so every packing verdict on Checked is personalized to your move to the US.",
  alternates: { canonical: "/check-in" },
  robots: { index: false, follow: true },
};

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
