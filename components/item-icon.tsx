import type { ReactNode } from "react";
import type { Category } from "@/lib/types";

/**
 * The single icon source for the whole app.
 *   <ItemIcon item={...} />     — per-item glyph, falling back to the category glyph
 *   <CategoryIcon category={} /> — the category glyph on its own
 *
 * Glyphs are hand-drawn inline SVGs on a 48×48 grid using the illustrated
 * palette below (matches the Weigh-In suitcase art). Add a new item glyph to
 * ITEM_GLYPHS and reference its key from a PackingItem's `icon` field.
 */

const O = "#14202e"; // outline
const BLUE = "#1466d8";
const BLUE_DEEP = "#1257b8";
const GREEN = "#4fcb8b";
const GREEN_DEEP = "#147a48";
const AMBER = "#f5a623";
const STEEL = "#8fa3c4";
const CREAM = "#fbf6ea";
const RED = "#d23b2e";
const LIGHT = "#e7f0fb";

function Svg({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0" aria-hidden="true">
      {children}
    </svg>
  );
}

// ── Category glyphs (fallback) ──────────────────────────────────────────────
const CATEGORY_GLYPHS: Record<Category, ReactNode> = {
  documents: (
    <>
      <rect x="11" y="7" width="26" height="34" rx="4" fill={BLUE} stroke={O} strokeWidth="2.5" />
      <circle cx="24" cy="19" r="6" fill={AMBER} stroke={O} strokeWidth="2" />
      <path d="M17 32h14" stroke={CREAM} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  clothing: (
    <>
      <path d="M17 10 22 7h4l5 3 8 6-5 6-3-2v20H15V20l-3 2-5-6z" fill={GREEN} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 8c1 4 7 4 8 0" fill="none" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  kitchen: (
    <>
      <circle cx="24" cy="11" r="3" fill={AMBER} stroke={O} strokeWidth="2" />
      <ellipse cx="24" cy="18" rx="14" ry="4.5" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <path d="M10 18v10c0 6 6 10 14 10s14-4 14-10V18" fill={STEEL} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  food: (
    <>
      <rect x="13" y="8" width="22" height="7" rx="2.5" fill={O} stroke={O} strokeWidth="2.5" />
      <path d="M15 15h18v20a5 5 0 0 1-5 5h-8a5 5 0 0 1-5-5z" fill={AMBER} stroke={O} strokeWidth="2.5" />
      <rect x="19" y="22" width="10" height="9" rx="2" fill={CREAM} stroke={O} strokeWidth="2" />
    </>
  ),
  medicines: (
    <>
      <rect x="8" y="13" width="32" height="26" rx="5" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <path d="M18 13v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" fill="none" stroke={O} strokeWidth="2.5" />
      <path d="M21 21h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill={RED} stroke={O} strokeWidth="2" />
    </>
  ),
  electronics: (
    <>
      <rect x="11" y="9" width="26" height="18" rx="3" fill={O} stroke={O} strokeWidth="2.5" />
      <rect x="14" y="12" width="20" height="12" rx="1.5" fill={BLUE} />
      <path d="m8 33 3-6h26l3 6a3 3 0 0 1-3 4H11a3 3 0 0 1-3-4z" fill={STEEL} stroke={O} strokeWidth="2.5" />
    </>
  ),
  bedding: (
    <>
      <path d="M10 14c8-4 20-4 28 0-2 8-2 12 0 20-8 4-20 4-28 0 2-8 2-12 0-20z" fill={LIGHT} stroke={O} strokeWidth="2.5" />
      <path d="M16 20c5-2 11-2 16 0" fill="none" stroke={STEEL} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  toiletries: (
    <>
      <rect x="19" y="6" width="10" height="7" rx="2" fill={O} stroke={O} strokeWidth="2" />
      <path d="M17 15h14v20a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill={BLUE_DEEP} stroke={O} strokeWidth="2.5" />
      <rect x="20" y="22" width="8" height="8" rx="2" fill={CREAM} />
    </>
  ),
  stationery: (
    <>
      <path d="M12 8h16l8 8v24a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" fill={CREAM} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M28 8v8h8" fill="none" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M16 26h16M16 32h12" stroke={STEEL} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  money: (
    <>
      <rect x="7" y="13" width="34" height="22" rx="4" fill={GREEN_DEEP} stroke={O} strokeWidth="2.5" />
      <path d="M7 18h34v5H7z" fill={O} />
      <rect x="12" y="27" width="12" height="4" rx="1.5" fill={CREAM} />
    </>
  ),
  misc: (
    <>
      <circle cx="24" cy="24" r="16" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <path d="M24 15a5 5 0 0 1 3 9c-2 1-3 2-3 4" fill="none" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="24" cy="33" r="1.8" fill={O} />
    </>
  ),
};

// ── Item glyphs ─────────────────────────────────────────────────────────────
const ITEM_GLYPHS: Record<string, ReactNode> = {
  passport: (
    <>
      <rect x="12" y="7" width="24" height="34" rx="3" fill={BLUE_DEEP} stroke={O} strokeWidth="2.5" />
      <circle cx="24" cy="19" r="5.5" fill={AMBER} stroke={O} strokeWidth="2" />
      <path d="M19 19h10M24 13.5v11" stroke={O} strokeWidth="1.6" />
      <path d="M18 31h12" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  folder: (
    <>
      <path d="M7 13a3 3 0 0 1 3-3h9l4 4h12a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" fill={AMBER} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M7 20h34" stroke={O} strokeWidth="2" />
    </>
  ),
  photo: (
    <>
      <rect x="8" y="10" width="32" height="28" rx="3" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <circle cx="18" cy="19" r="3.5" fill={AMBER} stroke={O} strokeWidth="1.8" />
      <path d="M11 34l9-9 6 5 5-4 6 6" fill="none" stroke={GREEN_DEEP} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  certificate: (
    <>
      <rect x="8" y="9" width="32" height="24" rx="3" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <path d="M14 16h20M14 21h14" stroke={STEEL} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="30" cy="34" r="5" fill={RED} stroke={O} strokeWidth="2" />
      <path d="M27 38l-2 5 5-3 5 3-2-5" fill={RED} stroke={O} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  tshirt: (
    <>
      <path d="M17 10 22 8h4l5 2 8 5-4 6-4-2v18H15V19l-4 2-4-6z" fill={GREEN} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  shirt: (
    <>
      <path d="M18 9 24 8l6 1 8 6-4 6-3-2v18H17V19l-3 2-4-6z" fill={CREAM} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 9v28" stroke={STEEL} strokeWidth="2" />
      <path d="M22 9l2 3 2-3" fill="none" stroke={O} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  pants: (
    <>
      <path d="M16 7h16l1 34h-8l-1-20-1 20h-8z" fill={BLUE_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M16 12h16" stroke={O} strokeWidth="2" />
    </>
  ),
  shorts: (
    <>
      <path d="M15 9h18l1 20h-8l-2-11-2 11h-8z" fill={STEEL} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M15 14h18" stroke={O} strokeWidth="2" />
    </>
  ),
  jacket: (
    <>
      <path d="M19 8l-9 6 3 7 4-2v15h14V25l4 2 3-7-9-6-2 3h-6z" fill={GREEN_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 11v23" stroke={AMBER} strokeWidth="2" strokeDasharray="2 2.5" />
    </>
  ),
  hoodie: (
    <>
      <path d="M18 8c2 4 10 4 12 0l8 7-4 6-4-2v15H18V26l-4 2-4-6z" fill={STEEL} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 8c0 5 12 5 12 0" fill={LIGHT} stroke={O} strokeWidth="2.2" />
      <path d="M22 22v9M26 22v9" stroke={O} strokeWidth="1.8" />
    </>
  ),
  socks: (
    <>
      <path d="M18 7h7v16c0 2 1 3 3 4l6 3a4 4 0 0 1-2 8l-6-2c-4-1-8-4-8-9z" fill={CREAM} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 13h7" stroke={O} strokeWidth="2" />
    </>
  ),
  towel: (
    <>
      <rect x="10" y="8" width="28" height="32" rx="3" fill={LIGHT} stroke={O} strokeWidth="2.5" />
      <path d="M31 8v32" stroke={STEEL} strokeWidth="2.4" />
      <path d="M34 14v20" stroke={STEEL} strokeWidth="2" />
    </>
  ),
  shoe: (
    <>
      <path d="M7 28c6 0 9-3 13-6 2 3 6 4 12 4l7 1c2 0 3 2 3 4v3H8a1 1 0 0 1-1-1z" fill={CREAM} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 22c1 2 3 4 6 5" fill="none" stroke={O} strokeWidth="2" />
      <path d="M8 34h34" stroke={O} strokeWidth="2.5" />
    </>
  ),
  ethnic: (
    <>
      <path d="M18 8l-3 4v28c0 1 1 2 2 2h14c1 0 2-1 2-2V12l-3-4-2 3h-8z" fill={AMBER} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 11v31" stroke={O} strokeWidth="1.6" strokeDasharray="2 2" />
      <path d="M20 8c1 3 7 3 8 0" fill="none" stroke={O} strokeWidth="2" />
    </>
  ),
  gloves: (
    <>
      <path d="M15 22V12a2 2 0 0 1 4 0v7l1-9a2 2 0 0 1 4 0l1 9V9a2 2 0 0 1 4 0v13c0 8-3 18-9 18-4 0-8-4-9-10z" fill={GREEN_DEEP} stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
    </>
  ),
  bedsheet: (
    <>
      <path d="M8 16c8-4 24-4 32 0-1 8-1 12 0 20-8 4-24 4-32 0 1-8 1-12 0-20z" fill={LIGHT} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 22c6-2 14-2 20 0" fill="none" stroke={STEEL} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 30c6-2 14-2 20 0" fill="none" stroke={STEEL} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  pillow: (
    <>
      <rect x="7" y="15" width="34" height="18" rx="9" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <path d="M14 24h6" stroke={STEEL} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  cooker: (
    <>
      <rect x="10" y="17" width="28" height="17" rx="4" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <rect x="8" y="12" width="32" height="6" rx="3" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <rect x="21" y="6" width="6" height="7" rx="2" fill={O} />
      <path d="M6 22h4M38 22h4" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  pan: (
    <>
      <ellipse cx="20" cy="26" rx="14" ry="10" fill={O} />
      <ellipse cx="20" cy="24" rx="14" ry="10" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <path d="M34 24h11" stroke={O} strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  plate: (
    <>
      <circle cx="24" cy="24" r="17" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="9" fill="none" stroke={STEEL} strokeWidth="2.2" />
    </>
  ),
  cutlery: (
    <>
      <path d="M17 8v32M13 8v8a4 4 0 0 0 8 0V8" fill="none" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M31 8c-3 0-5 3-5 8s2 7 5 7v17" fill="none" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  knife: (
    <>
      <path d="M9 30C9 16 22 8 33 7c1 6-3 17-14 24z" fill={STEEL} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M19 31l-8 9" stroke={O} strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  bottle: (
    <>
      <path d="M20 6h8v5l2 4v24a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V15l2-4z" fill={BLUE} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="18" y="22" width="12" height="8" fill={CREAM} />
    </>
  ),
  spice: (
    <>
      <rect x="14" y="14" width="20" height="26" rx="4" fill={AMBER} stroke={O} strokeWidth="2.5" />
      <rect x="17" y="8" width="14" height="6" rx="2" fill={O} />
      <circle cx="20" cy="11" r="1" fill={CREAM} />
      <circle cx="24" cy="11" r="1" fill={CREAM} />
      <circle cx="28" cy="11" r="1" fill={CREAM} />
      <rect x="18" y="24" width="12" height="12" rx="2" fill={CREAM} />
    </>
  ),
  rice: (
    <>
      <path d="M12 18h24l-2 20a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z" fill={CREAM} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M10 18c0-4 6-7 14-7s14 3 14 7" fill="none" stroke={O} strokeWidth="2.5" />
      <path d="M20 25l2 3 2-3M26 30l1 3" stroke={STEEL} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  ghee: (
    <>
      <rect x="12" y="16" width="24" height="24" rx="4" fill={AMBER} stroke={O} strokeWidth="2.5" />
      <rect x="15" y="10" width="18" height="6" rx="2" fill={O} />
      <rect x="16" y="22" width="16" height="10" rx="2" fill={CREAM} />
      <path d="M19 27h10" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  pickle: (
    <>
      <path d="M15 14h18v22a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4z" fill={GREEN_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="17" y="8" width="14" height="6" rx="2" fill={O} />
      <circle cx="21" cy="26" r="2" fill={AMBER} />
      <circle cx="27" cy="31" r="2" fill={AMBER} />
      <circle cx="24" cy="20" r="1.6" fill={RED} />
    </>
  ),
  instant: (
    <>
      <rect x="11" y="10" width="26" height="28" rx="3" fill={RED} stroke={O} strokeWidth="2.5" />
      <path d="M16 18c3 2 13 2 16 0M16 24c3 2 13 2 16 0M16 30c3 2 13 2 16 0" fill="none" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  snacks: (
    <>
      <path d="M13 12l22 3-3 26-16-2z" fill={AMBER} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M13 12l-2 4 3 25 2 2M35 15l2 3-3 25-2 1" fill="none" stroke={O} strokeWidth="2" />
    </>
  ),
  chai: (
    <>
      <path d="M11 18h22v8c0 6-5 11-11 11S11 32 11 26z" fill={CREAM} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M33 21h4a4 4 0 0 1 0 8h-4" fill="none" stroke={O} strokeWidth="2.5" />
      <path d="M18 9c-1 2 1 3 0 5M25 9c-1 2 1 3 0 5" fill="none" stroke={STEEL} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  coffee: (
    <>
      <path d="M12 16h20v9c0 6-4 11-10 11s-10-5-10-11z" fill={O} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 19h4a4 4 0 0 1 0 8h-4" fill="none" stroke={O} strokeWidth="2.5" />
      <ellipse cx="22" cy="17" rx="10" ry="3" fill={AMBER} />
      <path d="M17 39h10" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  pill: (
    <>
      <rect x="6" y="19" width="26" height="10" rx="5" transform="rotate(-30 19 24)" fill={RED} stroke={O} strokeWidth="2.5" />
      <path d="M17 12l9 15" stroke={O} strokeWidth="2.5" />
      <circle cx="34" cy="33" r="7" fill={CREAM} stroke={O} strokeWidth="2.5" />
      <path d="M34 29v8M30 33h8" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  syrup: (
    <>
      <path d="M18 6h12v6l2 3v22a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V15l2-3z" fill={AMBER} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="16" y="20" width="16" height="10" fill={CREAM} />
      <path d="M20 25h8" stroke={RED} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  balm: (
    <>
      <rect x="12" y="16" width="24" height="24" rx="5" fill={GREEN_DEEP} stroke={O} strokeWidth="2.5" />
      <rect x="14" y="10" width="20" height="7" rx="3" fill={STEEL} stroke={O} strokeWidth="2.2" />
      <circle cx="24" cy="28" r="5" fill={CREAM} />
    </>
  ),
  razor: (
    <>
      <rect x="21" y="18" width="6" height="22" rx="3" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <path d="M14 7h20v7a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z" fill={BLUE_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M17 17v2M22 17v2M27 17v2M32 17v2" stroke={O} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  soap: (
    <>
      <rect x="9" y="20" width="30" height="16" rx="6" fill={LIGHT} stroke={O} strokeWidth="2.5" />
      <path d="M18 14c0 3 3 3 3 6M26 12c0 3 3 3 3 6" fill="none" stroke={STEEL} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  laptop: (
    <>
      <rect x="10" y="10" width="28" height="20" rx="2.5" fill={O} stroke={O} strokeWidth="2.5" />
      <rect x="13" y="13" width="22" height="14" rx="1.5" fill={BLUE} />
      <path d="M6 34h36l-2 4a2 2 0 0 1-2 1H10a2 2 0 0 1-2-1z" fill={STEEL} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  phone: (
    <>
      <rect x="15" y="6" width="18" height="36" rx="4" fill={O} stroke={O} strokeWidth="2.5" />
      <rect x="18" y="11" width="12" height="24" rx="1" fill={BLUE} />
      <circle cx="24" cy="38" r="1.6" fill={CREAM} />
    </>
  ),
  adapter: (
    <>
      <rect x="12" y="16" width="24" height="20" rx="5" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <path d="M19 16v-6M29 16v-6" stroke={O} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="27" r="4" fill={CREAM} stroke={O} strokeWidth="2" />
    </>
  ),
  powerbank: (
    <>
      <rect x="14" y="7" width="20" height="34" rx="4" fill={O} stroke={O} strokeWidth="2.5" />
      <rect x="17" y="11" width="14" height="4" rx="1" fill={GREEN} />
      <path d="M25 20l-4 7h4l-1 6 5-8h-4z" fill={AMBER} stroke={O} strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
  harddisk: (
    <>
      <rect x="8" y="14" width="32" height="20" rx="3" fill={STEEL} stroke={O} strokeWidth="2.5" />
      <circle cx="18" cy="24" r="5" fill={CREAM} stroke={O} strokeWidth="2" />
      <circle cx="18" cy="24" r="1.4" fill={O} />
      <rect x="28" y="20" width="8" height="3" rx="1.5" fill={O} />
    </>
  ),
  pen: (
    <>
      <path d="M9 39l3-9L31 11l6 6-19 19z" fill={AMBER} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M28 14l6 6" stroke={O} strokeWidth="2" />
      <path d="M9 39l3-9 6 6z" fill={O} />
    </>
  ),
  book: (
    <>
      <path d="M10 9h16a4 4 0 0 1 4 4v26a3 3 0 0 0-3-3H10z" fill={BLUE_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M38 9H26a4 4 0 0 0-4 4v26a3 3 0 0 1 3-3h13z" fill={GREEN_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  glasses: (
    <>
      <circle cx="14" cy="26" r="7" fill="none" stroke={O} strokeWidth="2.6" />
      <circle cx="34" cy="26" r="7" fill="none" stroke={O} strokeWidth="2.6" />
      <path d="M21 25c1.5-2 4.5-2 6 0" fill="none" stroke={O} strokeWidth="2.4" />
      <path d="M7 22l-2-4M41 22l2-4" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  watch: (
    <>
      <rect x="17" y="4" width="14" height="12" rx="2" fill={STEEL} stroke={O} strokeWidth="2.4" />
      <rect x="17" y="32" width="14" height="12" rx="2" fill={STEEL} stroke={O} strokeWidth="2.4" />
      <circle cx="24" cy="24" r="11" fill={CREAM} stroke={O} strokeWidth="2.6" />
      <path d="M24 18v6h5" fill="none" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  wallet: (
    <>
      <rect x="8" y="12" width="32" height="24" rx="4" fill={GREEN_DEEP} stroke={O} strokeWidth="2.5" />
      <path d="M8 18h26a3 3 0 0 1 0 6H8" fill={CREAM} stroke={O} strokeWidth="2" />
      <circle cx="31" cy="21" r="2" fill={O} />
    </>
  ),
  umbrella: (
    <>
      <path d="M6 24C6 14 14 8 24 8s18 6 18 16z" fill={RED} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M6 24c3-3 6-3 9 0 3-3 6-3 9 0 3-3 6-3 9 0 3-3 6-3 9 0" fill="none" stroke={O} strokeWidth="2" />
      <path d="M24 8v28a4 4 0 0 1-8 0" fill="none" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  backpack: (
    <>
      <path d="M13 18c0-6 5-10 11-10s11 4 11 10v18a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3z" fill={BLUE_DEEP} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 8c0-3 12-3 12 0" fill="none" stroke={O} strokeWidth="2.4" />
      <rect x="18" y="24" width="12" height="14" rx="2" fill={CREAM} stroke={O} strokeWidth="2" />
      <path d="M13 22h22" stroke={O} strokeWidth="2" />
    </>
  ),
  tool: (
    <>
      <path d="M30 8a8 8 0 0 0-8 11L9 32a3 3 0 0 0 4 4l13-13a8 8 0 0 0 11-8l-5 5-4-1-1-4z" fill={STEEL} stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
    </>
  ),
};

export function CategoryIcon({ category, size = 24 }: { category: Category; size?: number }) {
  return <Svg size={size}>{CATEGORY_GLYPHS[category] ?? CATEGORY_GLYPHS.misc}</Svg>;
}

export function ItemIcon({
  item,
  size = 24,
}: {
  item: { icon?: string; category: Category };
  size?: number;
}) {
  const glyph = (item.icon && ITEM_GLYPHS[item.icon]) || CATEGORY_GLYPHS[item.category] || CATEGORY_GLYPHS.misc;
  return <Svg size={size}>{glyph}</Svg>;
}
