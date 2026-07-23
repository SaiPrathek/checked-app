import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debrief — share what was worth packing",
  description:
    "Landed already? Tell us what was worth packing. Every rating helps build the community data behind The Hold's verdicts for the next student making the move.",
  alternates: { canonical: "/debrief" },
  robots: { index: false, follow: true },
};

export default function DebriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
