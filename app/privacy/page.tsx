import { LegalPage } from "@/components/legal-page";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 23, 2026">
      <p>
        Checked (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps students moving from
        India to the US plan what to pack. This page explains what we collect,
        why, and the choices you have. We collect as little as possible and never
        sell your data.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your packing data.</strong> Your Check-In answers (e.g. school,
          city, climate, intake), your Manifest selections and quantities, bag
          setup, checklist progress, and Debrief ratings.
        </li>
        <li>
          <strong>On your device first.</strong> This data is saved in your
          browser&apos;s local storage so the app works without an account.
        </li>
        <li>
          <strong>In your account (only if you sign in).</strong> When you sign
          in, the same data is synced to our database so it follows you across
          devices. Sign-in is handled by Clerk; we store your user ID and email.
        </li>
        <li>
          <strong>Usage analytics.</strong> Aggregate page analytics and a few
          product events (such as clicks on &ldquo;buy in the US&rdquo; links) to
          understand and improve the product. See{" "}
          <a href="/disclosure">our disclosure</a>.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        To generate your personalized packing verdicts and luggage plan, to sync
        your data if you sign in, and to improve the product. Questions you ask
        The Tower are sent to our AI provider (Groq) to generate a grounded
        answer; we don&apos;t use them to identify you.
      </p>

      <h2>Who we share it with</h2>
      <p>
        Only the service providers that run Checked — our authentication provider
        (Clerk), our database and hosting (Neon, Vercel), and our AI provider
        (Groq) — and only as needed to operate the app. We do not sell personal
        data.
      </p>

      <h2>Your choices &amp; rights</h2>
      <ul>
        <li>Use the app signed-out to keep data on your device only.</li>
        <li>Clear your browser storage to remove local data at any time.</li>
        <li>
          Request access to or deletion of your account data by emailing us
          (see below). If you are in India, the Digital Personal Data Protection
          Act, 2023 gives you rights over your personal data; we honour access
          and deletion requests.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions or data requests: <strong>[your contact email]</strong>.
      </p>
    </LegalPage>
  );
}
