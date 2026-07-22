import type { Category, Profile } from "./types";

/**
 * The exhaustive "Sanjeev Sriram" packing checklist, reproduced verbatim.
 *
 * This is the *gather/prep* tracker that backs the Manifest's Checklist table view —
 * a separate axis from the packable cards (which drive Weigh-In weight). Ticking a row
 * is a pure done-tracker; it never affects the packing list. Columns mirror the source
 * PDF: ITEM · QUANTITY · BUYING PLACE · NOTE.
 *
 * `buyingPlace`: IN = bring from India · US = buy in the US · NA = get/prepare (documents).
 * Rows are grouped onto our Category enum (KITCHENWARE→kitchen, STATIONARY→stationery,
 * MISCELLANEOUS→misc; the PDF's bedding rows → bedding).
 */
export interface ChecklistRow {
  id: string;
  category: Category;
  item: string;
  quantity: string;
  buyingPlace: "IN" | "US" | "NA";
  note?: string;
  /** Hide rows irrelevant to the profile (reuses the Check-In background toggles). */
  visibleIf?: (p: Profile) => boolean;
}

const hasWorkExp = (p: Profile) => p.workExperience === "yes";
const hasLicense = (p: Profile) => p.license === "yes";
const wearsGlasses = (p: Profile) => p.wearsGlasses === "yes";

export const CHECKLIST: ChecklistRow[] = [
  // ── DOCUMENTS ────────────────────────────────────────────────────────────
  { id: "doc-passport", category: "documents", item: "Passport", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", note: "Also, get a Passport Cover" },
  { id: "doc-ds160", category: "documents", item: "DS-160 Confirmation", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-visa-appt", category: "documents", item: "Visa Appointment Confirmation", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-i20", category: "documents", item: "Signed I-20", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", note: "Sign and mention the date" },
  { id: "doc-sevis", category: "documents", item: "SEVIS Fee Receipt", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-cgi", category: "documents", item: "CGI Payment Receipt", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-decision", category: "documents", item: "Finalized Decision Letter", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-acceptance", category: "documents", item: "Finalized Mail Acceptance Letter", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-gre", category: "documents", item: "GRE Scores", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-english", category: "documents", item: "English Test Scores", quantity: "3 (Copies)", buyingPlace: "NA", note: "TOEFL / IELTS / Duolingo" },
  { id: "doc-10th", category: "documents", item: "10th Long Memo", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-12th", category: "documents", item: "12th Long Memo", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-bach-transcripts", category: "documents", item: "Bachelors Semester Transcripts", quantity: "2 (Org) + 2 (Copies)", buyingPlace: "NA", note: "Individual semester marksheets (including backlogs)" },
  { id: "doc-pc-cmm", category: "documents", item: "PC & CMM Transcripts", quantity: "2 (Org) + 2 (Copies)", buyingPlace: "NA" },
  { id: "doc-bach-memos", category: "documents", item: "Bachelors Original Memos", quantity: "1 (Org) + 2 (Copies)", buyingPlace: "NA", note: "Individual semester marksheets (including backlogs)" },
  { id: "doc-degree", category: "documents", item: "Original Degree", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-payslips", category: "documents", item: "Pay Slips", quantity: "1 (Org) + 1 (Copy)", buyingPlace: "NA", note: "If you have work experience", visibleIf: hasWorkExp },
  { id: "doc-offer", category: "documents", item: "Offer Letter", quantity: "1 (Org) + 1 (Copy)", buyingPlace: "NA", note: "If you have work experience", visibleIf: hasWorkExp },
  { id: "doc-experience", category: "documents", item: "Experience Certificate", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", note: "If you have work experience", visibleIf: hasWorkExp },
  { id: "doc-loan", category: "documents", item: "Loan Confirmation Letter", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-bank", category: "documents", item: "Bank Balance Certificate", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-ca-ce", category: "documents", item: "CA/CE Reports", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-extra-decision", category: "documents", item: "Extra Admits Decision Letters", quantity: "2 (Copies)", buyingPlace: "NA", note: "If you have any from other universities" },
  { id: "doc-extra-acceptance", category: "documents", item: "Extra Mail Acceptance Letters", quantity: "2 (Copies)", buyingPlace: "NA" },
  { id: "doc-extra-i20", category: "documents", item: "Extra I-20s", quantity: "2 (Copies)", buyingPlace: "NA" },
  { id: "doc-resume", category: "documents", item: "Resume", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-sop", category: "documents", item: "Final SOP", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-lor", category: "documents", item: "LOR", quantity: "1 (Org) + 2 (Copies)", buyingPlace: "NA", note: "If you have access" },
  { id: "doc-visa-copy", category: "documents", item: "Visa Copy", quantity: "3 (Copies)", buyingPlace: "NA", note: "Visa stamp from your passport" },
  { id: "doc-immunization", category: "documents", item: "Immunization Forms", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", note: "From the university website" },
  { id: "doc-covid", category: "documents", item: "International COVID Vaccination Certificate", quantity: "3 (Copies)", buyingPlace: "NA", note: "From the CoWIN website" },
  { id: "doc-aadhaar", category: "documents", item: "Aadhaar Card", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-pan", category: "documents", item: "PAN Card", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-license", category: "documents", item: "Driving License", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", visibleIf: hasLicense },
  { id: "doc-idp", category: "documents", item: "International Driving Permit", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", visibleIf: hasLicense },
  { id: "doc-birth", category: "documents", item: "Birth Certificate", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA" },
  { id: "doc-photos", category: "documents", item: "Passport Size Photos", quantity: "16 Pcs", buyingPlace: "NA" },
  { id: "doc-flight", category: "documents", item: "Flight Tickets", quantity: "2 (Copies)", buyingPlace: "NA" },
  { id: "doc-us-address", category: "documents", item: "US Address", quantity: "3 (Copies)", buyingPlace: "NA", note: "Your immediate US address" },
  { id: "doc-contacts", category: "documents", item: "Contacts", quantity: "3 (Copies)", buyingPlace: "NA", note: "Emergency contacts (if the mobile is dead)" },
  { id: "doc-blank-paper", category: "documents", item: "Blank White Papers", quantity: "3 (Copies)", buyingPlace: "NA" },
  { id: "doc-additional", category: "documents", item: "Additional Documents", quantity: "1 (Org) + 3 (Copies)", buyingPlace: "NA", note: "Other important documents" },

  // ── CLOTHING ─────────────────────────────────────────────────────────────
  { id: "cloth-tshirts", category: "clothing", item: "T-Shirts", quantity: "10 Pcs", buyingPlace: "IN" },
  { id: "cloth-shorts", category: "clothing", item: "Shorts", quantity: "5 Pcs", buyingPlace: "IN", note: "If your place is cool bring more pants; if not, more shorts" },
  { id: "cloth-track-pants", category: "clothing", item: "Track Pants", quantity: "8 Pcs", buyingPlace: "IN" },
  { id: "cloth-innerwear", category: "clothing", item: "Inner Wear", quantity: "15 Pcs", buyingPlace: "IN" },
  { id: "cloth-formal-shirts", category: "clothing", item: "Formal Shirts", quantity: "4 Pcs", buyingPlace: "IN", note: "Bring at least 1 black & 1 white" },
  { id: "cloth-jeans", category: "clothing", item: "Jeans", quantity: "4 Pcs", buyingPlace: "IN", note: "Bring at least 1 solid black" },
  { id: "cloth-chinos", category: "clothing", item: "Chinos / Pants", quantity: "2 Pcs", buyingPlace: "IN", note: "Formal trousers" },
  { id: "cloth-joggers", category: "clothing", item: "Joggers", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "cloth-suit", category: "clothing", item: "Formal Suit", quantity: "1 Pair", buyingPlace: "US", note: "For interviews & formal events" },
  { id: "cloth-hoodies", category: "clothing", item: "Hoodies", quantity: "4 Pcs", buyingPlace: "US" },
  { id: "cloth-jacket", category: "clothing", item: "Jacket", quantity: "1 Pc", buyingPlace: "US", note: "Thick, weatherproof jacket" },
  { id: "cloth-traditional", category: "clothing", item: "Traditional Wear", quantity: "2 Pairs", buyingPlace: "IN" },
  { id: "cloth-swimwear", category: "clothing", item: "Swim Wear", quantity: "1 Pair", buyingPlace: "IN", note: "Nylon clothes" },
  { id: "cloth-towels", category: "clothing", item: "Towels", quantity: "4 Pcs", buyingPlace: "IN" },
  { id: "cloth-hand-towels", category: "clothing", item: "Hand Towels", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "cloth-kerchief", category: "clothing", item: "Kerchief", quantity: "12 Pcs", buyingPlace: "IN" },
  { id: "cloth-belt", category: "clothing", item: "Belt", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "cloth-cap", category: "clothing", item: "Cap", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "cloth-muffler", category: "clothing", item: "Muffler", quantity: "1 Pc", buyingPlace: "US", note: "Bring it if you already have one" },
  { id: "cloth-woolen-cap", category: "clothing", item: "Woolen Cap", quantity: "1 Pc", buyingPlace: "US" },
  { id: "cloth-gloves", category: "clothing", item: "Gloves", quantity: "1 Pc", buyingPlace: "US" },
  { id: "cloth-flipflops", category: "clothing", item: "Flip-Flops", quantity: "2 Pairs", buyingPlace: "IN" },
  { id: "cloth-shoes", category: "clothing", item: "Shoes", quantity: "2 Pairs", buyingPlace: "IN" },
  { id: "cloth-socks", category: "clothing", item: "Socks", quantity: "12 Pairs", buyingPlace: "IN" },
  { id: "cloth-crocs", category: "clothing", item: "Crocs / Floaters", quantity: "1 Pair", buyingPlace: "IN" },

  // ── BEDDING (PDF lists these under Clothing) ───────────────────────────────
  { id: "bed-sheet", category: "bedding", item: "Bed Sheet", quantity: "2 Pcs", buyingPlace: "IN", note: "Prefer king-size bed sheets" },
  { id: "bed-pillow-covers", category: "bedding", item: "Pillow Covers", quantity: "4 Pcs", buyingPlace: "IN", note: "Large size" },
  { id: "bed-pillow", category: "bedding", item: "Pillow", quantity: "1 Pc", buyingPlace: "US" },
  { id: "bed-thick-blanket", category: "bedding", item: "Thick Blanket", quantity: "1 Pc", buyingPlace: "US" },
  { id: "bed-thin-blanket", category: "bedding", item: "Thin Blanket", quantity: "1 Pc", buyingPlace: "IN" },

  // ── KITCHENWARE ────────────────────────────────────────────────────────────
  { id: "kit-steel-plates", category: "kitchen", item: "Steel Plates", quantity: "2 Pcs", buyingPlace: "IN", note: "Prefer light-weight steel" },
  { id: "kit-steel-glasses", category: "kitchen", item: "Steel Glasses", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "kit-pan", category: "kitchen", item: "Cooking Pan", quantity: "1 Pc", buyingPlace: "IN", note: "Prefer induction base" },
  { id: "kit-kadai", category: "kitchen", item: "Kadai", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-tea-pot", category: "kitchen", item: "Tea / Milk Pot", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-cooker", category: "kitchen", item: "Pressure Cooker", quantity: "1 Pc", buyingPlace: "IN", note: "Prefer 2–3 L induction. Bring extra whistles & gaskets" },
  { id: "kit-mw-bowl", category: "kitchen", item: "Microwave Safe Bowl", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-mw-glass", category: "kitchen", item: "Microwave Safe Glass", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-strainer", category: "kitchen", item: "Tea Strainer", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-cooking-spoons", category: "kitchen", item: "Cooking Spoons", quantity: "4 Pcs", buyingPlace: "IN", note: "Prefer different wooden spoons" },
  { id: "kit-spoons-forks", category: "kitchen", item: "Spoons / Forks", quantity: "6 Pcs", buyingPlace: "IN" },
  { id: "kit-peeler", category: "kitchen", item: "Peeler", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-chopping-board", category: "kitchen", item: "Chopping Board", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-chopper", category: "kitchen", item: "Plastic Chopper", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-knives", category: "kitchen", item: "Knives", quantity: "2 Pcs", buyingPlace: "IN", note: "Pack safely (checked bag only)" },
  { id: "kit-scissors", category: "kitchen", item: "Scissors", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "kit-water-bottle", category: "kitchen", item: "Water Bottle", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-belan", category: "kitchen", item: "Roti Roller (Belan)", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-tongs", category: "kitchen", item: "Tongs (Patkara)", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-skimmer", category: "kitchen", item: "Skimmer Spoon", quantity: "1 Pc", buyingPlace: "IN", note: "For deep-frying food" },
  { id: "kit-grater", category: "kitchen", item: "Grater", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-aalu-masher", category: "kitchen", item: "Aalu Masher", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "kit-dal-masher", category: "kitchen", item: "Dal Masher", quantity: "1 Pc", buyingPlace: "IN" },

  // ── FOOD ITEMS ──────────────────────────────────────────────────────────────
  { id: "food-coriander", category: "food", item: "Coriander Powder", quantity: "500 gms", buyingPlace: "IN" },
  { id: "food-garam-masala", category: "food", item: "Garam Masala", quantity: "250 gms", buyingPlace: "IN" },
  { id: "food-jeera", category: "food", item: "Jeera Powder", quantity: "250 gms", buyingPlace: "IN" },
  { id: "food-chilli", category: "food", item: "Red Chilli Powder", quantity: "1 kg", buyingPlace: "IN" },
  { id: "food-other-masalas", category: "food", item: "Other Masalas", quantity: "1 kg", buyingPlace: "IN" },
  { id: "food-gg-paste", category: "food", item: "Ginger Garlic Paste", quantity: "1 kg", buyingPlace: "IN" },
  { id: "food-ghee", category: "food", item: "Ghee", quantity: "1 kg", buyingPlace: "IN", note: "Freeze before packing" },
  { id: "food-pickles", category: "food", item: "Pickles", quantity: "As needed", buyingPlace: "IN", note: "Go for double packing" },
  { id: "food-sweets", category: "food", item: "Sweets", quantity: "As needed", buyingPlace: "IN" },
  { id: "food-snacks", category: "food", item: "Snacks", quantity: "As needed", buyingPlace: "IN" },
  { id: "food-instant", category: "food", item: "Instant Food", quantity: "6 Packs", buyingPlace: "IN", note: "e.g. Maggi, masala oats" },
  { id: "food-pulses", category: "food", item: "Pulses / Nuts", quantity: "As needed", buyingPlace: "IN", note: "If you have space and weight" },

  // ── TOILETRIES ────────────────────────────────────────────────────────────
  { id: "toil-toothbrush", category: "toiletries", item: "Tooth Brush", quantity: "3 Pcs", buyingPlace: "IN", note: "Bring only for initial usage" },
  { id: "toil-toothpaste", category: "toiletries", item: "Tooth Paste", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-tongue-cleaner", category: "toiletries", item: "Tongue Cleaner", quantity: "3 Pcs", buyingPlace: "IN" },
  { id: "toil-soap", category: "toiletries", item: "Soap", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "toil-soap-case", category: "toiletries", item: "Soap Case", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-comb", category: "toiletries", item: "Comb", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-hair-oil", category: "toiletries", item: "Hair Oil", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-facewash", category: "toiletries", item: "Facewash", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-shampoo", category: "toiletries", item: "Shampoo", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-sunscreen", category: "toiletries", item: "Sun Screen", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-perfume", category: "toiletries", item: "Perfume", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-moisturizer", category: "toiletries", item: "Moisturizer", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-earbuds", category: "toiletries", item: "Earbuds", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-vaseline", category: "toiletries", item: "Vaseline", quantity: "3 Pcs", buyingPlace: "IN" },
  { id: "toil-lip-balm", category: "toiletries", item: "Lip Balm", quantity: "3 Pcs", buyingPlace: "IN" },
  { id: "toil-nail-cutter", category: "toiletries", item: "Nail Cutter", quantity: "3 Pcs", buyingPlace: "IN" },
  { id: "toil-trimmer", category: "toiletries", item: "Trimmer", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "toil-shaving-kit", category: "toiletries", item: "Shaving Kit", quantity: "1 Pc", buyingPlace: "IN" },

  // ── ELECTRONICS ──────────────────────────────────────────────────────────────
  { id: "elec-adapter", category: "electronics", item: "Travel Adaptor", quantity: "2 Pcs", buyingPlace: "IN", note: "For port conversion" },
  { id: "elec-spike-buster", category: "electronics", item: "Spike Buster / Extension Cord", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "elec-power-bank", category: "electronics", item: "Power Bank", quantity: "1 Pc", buyingPlace: "IN", note: "Under 20000 mAh; carry-on only" },
  { id: "elec-phone", category: "electronics", item: "Smart Phone", quantity: "1 Pc", buyingPlace: "US" },
  { id: "elec-laptop", category: "electronics", item: "Laptop", quantity: "1 Pc", buyingPlace: "US" },
  { id: "elec-earphones", category: "electronics", item: "Earphones", quantity: "1 Pc", buyingPlace: "US" },
  { id: "elec-headphones", category: "electronics", item: "Headphones", quantity: "1 Pc", buyingPlace: "US" },
  { id: "elec-pendrive", category: "electronics", item: "Pendrive", quantity: "1 Pc", buyingPlace: "US", note: "Do not carry illegal data" },
  { id: "elec-hdd", category: "electronics", item: "External Hard Disk", quantity: "1 Pc", buyingPlace: "US" },
  { id: "elec-accessories", category: "electronics", item: "Other Accessories", quantity: "As needed", buyingPlace: "IN", note: "Screen protectors, back case, etc." },

  // ── MEDICINES ─────────────────────────────────────────────────────────────
  { id: "med-crocin", category: "medicines", item: "Crocin / Dolo 650", quantity: "1 Strip", buyingPlace: "IN", note: "Fever, cold. Carry a doctor's prescription + medicine bill in your name" },
  { id: "med-cetirizine", category: "medicines", item: "Cetirizine", quantity: "1 Strip", buyingPlace: "IN", note: "Running nose" },
  { id: "med-ascoril", category: "medicines", item: "Ascoril Syrup", quantity: "1 Bottle", buyingPlace: "IN", note: "Cough" },
  { id: "med-combiflam", category: "medicines", item: "Combiflam", quantity: "1 Strip", buyingPlace: "IN", note: "Body pain" },
  { id: "med-erythromycin", category: "medicines", item: "Erythromycin / Azethral", quantity: "1 Strip", buyingPlace: "IN", note: "Throat infection" },
  { id: "med-avomine", category: "medicines", item: "Avomine", quantity: "1 Strip", buyingPlace: "IN", note: "Vomiting" },
  { id: "med-cyclopam", category: "medicines", item: "Cyclopam / Dropar", quantity: "1 Strip", buyingPlace: "IN", note: "Stomach pain & period cramps" },
  { id: "med-loperamide", category: "medicines", item: "Loperamide / Loparet", quantity: "1 Strip", buyingPlace: "IN", note: "Diarrhea" },
  { id: "med-gelucil", category: "medicines", item: "Gelucil / Zinetac", quantity: "1 Strip", buyingPlace: "IN", note: "Indigestion" },
  { id: "med-diziron", category: "medicines", item: "Diziron", quantity: "1 Strip", buyingPlace: "IN", note: "Dizziness" },
  { id: "med-esgypyrin", category: "medicines", item: "Esgypyrin", quantity: "1 Strip", buyingPlace: "IN", note: "Sprain" },
  { id: "med-vicks-vaporub", category: "medicines", item: "Vicks VapoRub", quantity: "2 Pcs", buyingPlace: "IN", note: "Large size" },
  { id: "med-vicks-inhaler", category: "medicines", item: "Vicks Inhaler", quantity: "4 Pcs", buyingPlace: "IN" },
  { id: "med-zandu-balm", category: "medicines", item: "Zandu Balm", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "med-volini", category: "medicines", item: "Volini Spray", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "med-zinda-tilismath", category: "medicines", item: "Zinda Tilismath", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "med-bandaid", category: "medicines", item: "Band Aid", quantity: "10 Strips", buyingPlace: "IN" },
  { id: "med-cotton", category: "medicines", item: "Cotton", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "med-dettol", category: "medicines", item: "Dettol", quantity: "1 Pc", buyingPlace: "IN" },

  // ── STATIONARY ──────────────────────────────────────────────────────────────
  { id: "stat-books", category: "stationery", item: "Books", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "stat-pens", category: "stationery", item: "Pens", quantity: "5 Pcs", buyingPlace: "IN" },
  { id: "stat-pencils", category: "stationery", item: "Pencils", quantity: "5 Pcs", buyingPlace: "IN" },
  { id: "stat-erasers", category: "stationery", item: "Erasers", quantity: "3 Pcs", buyingPlace: "IN" },
  { id: "stat-sharpeners", category: "stationery", item: "Sharpeners", quantity: "3 Pcs", buyingPlace: "IN" },
  { id: "stat-scales", category: "stationery", item: "Scales", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "stat-stapler", category: "stationery", item: "Stapler", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "stat-cello-tape", category: "stationery", item: "Cello Tape", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "stat-packing-tape", category: "stationery", item: "Packing Tape", quantity: "2 Pcs", buyingPlace: "IN" },
  { id: "stat-files", category: "stationery", item: "Files / Folders", quantity: "3 Pcs", buyingPlace: "IN" },

  // ── MISCELLANEOUS ────────────────────────────────────────────────────────────
  { id: "misc-spectacles", category: "misc", item: "Spectacles", quantity: "4 Pcs", buyingPlace: "IN", note: "If you have eyesight", visibleIf: wearsGlasses },
  { id: "misc-sunglasses", category: "misc", item: "Sun Glasses", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-watch", category: "misc", item: "Watch", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-backpack", category: "misc", item: "Backpack", quantity: "1 Pc", buyingPlace: "IN", note: "Prefer a big laptop bag" },
  { id: "misc-wallet", category: "misc", item: "Wallet", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-toothpick", category: "misc", item: "Toothpick", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-screwdriver", category: "misc", item: "Screw Driver Set", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-sewing-kit", category: "misc", item: "Sewing Kit", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-umbrella", category: "misc", item: "Umbrella", quantity: "1 Pc", buyingPlace: "US", note: "Should withstand snow" },
  { id: "misc-calculator", category: "misc", item: "Scientific Calculator", quantity: "1 Pc", buyingPlace: "IN" },
  { id: "misc-passport-cover", category: "misc", item: "Passport Cover", quantity: "1 Pc", buyingPlace: "IN" },
];

/** Visible checklist rows for a category, honoring profile gating. */
export function checklistFor(category: Category, profile: Profile): ChecklistRow[] {
  return CHECKLIST.filter(
    (r) => r.category === category && (r.visibleIf ? r.visibleIf(profile) : true),
  );
}

/** Does this category have any checklist rows at all? */
export function hasChecklist(category: Category, profile: Profile): boolean {
  return checklistFor(category, profile).length > 0;
}

/** Gathered / total for a set of rows given the user's checked-off map. */
export function checklistProgress(
  rows: ChecklistRow[],
  checkedOff: Record<string, boolean>,
): { done: number; total: number } {
  const done = rows.reduce((n, r) => n + (checkedOff[r.id] ? 1 : 0), 0);
  return { done, total: rows.length };
}
