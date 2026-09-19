export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-950">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Privacy</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Privacy notice</h1>
        <p className="text-muted mt-2 text-sm">Plain-language summary. Replace with your real policy before any commercial use.</p>

        <div className="mt-6 rounded-md border border-amber/30 bg-amber/5 text-amber p-5 text-sm">
          <strong>Demo product.</strong> Lumora on this domain is a demonstration. We do not collect personal data from this site, do not run real-money trades, and do not transmit data to a live broker.
        </div>

        <div className="mt-8 space-y-6">
          <Section title="What we collect">
            <p>This demo keeps your name, email and phone number in your browser's localStorage so the experience feels real. Nothing is sent to our servers.</p>
          </Section>
          <Section title="What we do not do">
            <p>We do not sell personal data. We do not share it with advertisers. We do not profile you across sites.</p>
          </Section>
          <Section title="Cookies">
            <p>No tracking cookies. The Zustand persistence layer writes a single localStorage entry called <code className="text-green">lumora-trade-v2</code>.</p>
          </Section>
          <Section title="Third parties">
            <p>If you trigger an M-Pesa test deposit, your phone and amount are sent to your own M-Pesa backend (the URL you set in <code className="text-green">.env.local</code>) to obtain an STK push prompt. No data is shared with us.</p>
          </Section>
          <Section title="Your rights">
            <p>You can clear all of Lumora's local data at any time from the browser's "Clear site data" menu. After that the demo restarts.</p>
          </Section>
          <Section title="Compliance">
            <p>For a real-money service, applicable data protection laws (e.g. Kenya's Data Protection Act 2019, GDPR in the EU) would apply. The same handler, encryption-at-rest and DSARs expected by those laws would be required.</p>
          </Section>
        </div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-muted leading-relaxed text-sm">{children}</div>
    </section>
  );
}
