import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weigh-In — luggage weight simulator",
  description:
    "Assign items to your bags and watch live weight meters. Plan around airline limits so you're never over at the airport counter on your move to the US.",
  alternates: { canonical: "/weigh-in" },
  robots: { index: false, follow: true },
};

export default function WeighInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
