export default function LegalPage() {
  return (
    <main className="min-h-screen bg-bg-950">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
        <h1 className="text-3xl font-semibold">Risk and legal</h1>
        <p className="text-muted mt-2 text-sm">Plain-language summary. Replace with your real policy when you go live.</p>

        <div className="mt-6 rounded-md border border-amber/30 bg-amber/5 text-amber p-5 text-sm">
          <p><strong>Demo product.</strong> Lumora on this domain shows a simulated market with virtual funds. No live exchange connection. No real-money positions are taken.</p>
        </div>

        <div className="mt-8 space-y-7 text-sm space-y-6">
          <Section title="No investment advice">
            <p>Lumora does not provide investment, financial, or trading advice. Anything you read here is general information.</p>
          </Section>
          <Section title="Risk warning">
            <p>Trading binary options and other leveraged products carries a high level of risk and can result in the loss of all your invested capital. Don't invest money you can't afford to lose.</p>
          </Section>
          <Section title="Regulatory note">
            <p>Binary options brokers are heavily regulated or banned in many jurisdictions, including Kenya, the EU, the UK and elsewhere. Anyone offering a real-money version of this product to the public must hold the appropriate licence (CMA in Kenya, CySEC in the EU, FCA in the UK).</p>
          </Section>
          <Section title="Deposits and withdrawals">
            <p>Deposits are made via Safaricom M-Pesa with a clearly-quoted KES amount. Withdrawals may take up to 24 hours to review and process.</p>
          </Section>
          <Section title="Imagery">
            <p>Hero photographs are stock images provided by their respective rights-holders and used here for prototyping. Replace with a licensed set before any commercial launch.</p>
          </Section>
        </div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-muted leading-relaxed">{children}</div>
    </section>
  );
}
