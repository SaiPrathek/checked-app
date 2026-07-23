import { LegalPage } from "@/components/legal-page";

export default function Disclosure() {
  return (
    <LegalPage title="Affiliate Disclosure" updated="July 23, 2026">
      <p>
        Checked is free to use. Some of the &ldquo;buy in the US&rdquo; links in
        the app are <strong>affiliate links</strong> — if you click one and make
        a purchase, we may earn a small commission at no extra cost to you.
      </p>

      <h2>Commissions never influence our verdicts</h2>
      <p>
        Whether an item is worth bringing from India, buying in the US, or
        skipping is decided by community data and item facts alone. We never
        change a verdict, ranking, or recommendation because a link earns a
        commission. An affiliate link only ever appears on items we already
        recommend buying in the US.
      </p>

      <h2>How to spot them</h2>
      <p>
        Affiliate links open in a new tab and are marked{" "}
        <code>rel=&quot;sponsored nofollow&quot;</code>. You&apos;re never
        required to use them — you can search for any product yourself.
      </p>

      <h2>Why we do this</h2>
      <p>
        Commissions help keep Checked free and independent. If our incentives and
        your interests ever seem to conflict, our commitment is simple: the
        honest verdict wins. Questions:{" "}
        <a href="mailto:kothasaiprathek@gmail.com">kothasaiprathek@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
