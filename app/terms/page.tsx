import { LegalPage } from "@/components/legal-page";

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="July 23, 2026">
      <p>
        By using Checked you agree to these terms. If you don&apos;t agree,
        please don&apos;t use the app.
      </p>

      <h2>What Checked is</h2>
      <p>
        Checked provides packing guidance, a luggage-weight simulator, and
        AI-assisted answers for students relocating from India to the US. It is
        an informational tool, not professional advice.
      </p>

      <h2>Not official or professional advice</h2>
      <p>
        Verdicts and answers are based on community data and general item facts
        and may be wrong or out of date. For visa, immigration, customs, tax,
        legal, medical, or airline-baggage questions, always confirm with the
        official source — USCIS, the U.S. Department of State, your airline, or
        your university&apos;s international student office. Airline weight and
        cabin rules vary; the simulator is an estimate only.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide accurate information and use the app lawfully.</li>
        <li>
          Don&apos;t misuse the service — including attempting to overload,
          scrape, or abuse the AI features (which are rate-limited).
        </li>
        <li>You are responsible for your own packing and travel decisions.</li>
      </ul>

      <h2>Accounts</h2>
      <p>
        Accounts are provided through Clerk. You&apos;re responsible for activity
        under your account. You can stop using Checked at any time.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Some outbound links may earn us a commission. This never influences our
        verdicts — see <a href="/disclosure">our disclosure</a>.
      </p>

      <h2>No warranty &amp; liability</h2>
      <p>
        Checked is provided &ldquo;as is&rdquo; without warranties of any kind.
        To the maximum extent permitted by law, we are not liable for any loss
        arising from your use of the app or reliance on its guidance.
      </p>

      <h2>Changes &amp; contact</h2>
      <p>
        We may update these terms; continued use means you accept the changes.
        Questions: <strong>[your contact email]</strong>.
      </p>
    </LegalPage>
  );
}
