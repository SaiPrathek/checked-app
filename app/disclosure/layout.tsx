import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How Checked makes money and why affiliate commissions never influence our packing verdicts.",
  alternates: { canonical: "/disclosure" },
};

export default function DisclosureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
