import { PricingTiers } from "./PricingTiers";
import { PrimaryButton } from "@/features/shared/MarketingButtons";

export function PricingPage() {
  return (
    <main id="main">
      <section className="section-y">
        <div className="shell">
          <p className="eyebrow">Pilot pricing</p>
          <h1 className="mt-5 max-w-3xl text-4xl tracking-[-0.02em] text-foreground md:text-h2">
            Start simple, then carry memory forward.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            Try the output first — no signup, nothing saved. Start a memory trial when you want BEVI
            to remember accounts, shape follow-up and carry the next call forward.
          </p>
          <PricingTiers />
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Delivers the next move</p>
          <h2 className="mt-4 text-3xl leading-tight tracking-[-0.02em] text-foreground md:text-h2">
            BEVI sits after the field visit, where sales value is either captured or lost.
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
            Transcription tools capture what was said. CRMs store what happened. BEVI helps the rep
            decide what matters next: the formal note, the follow-up, the account memory and the
            best next move.
          </p>
          <div className="mt-9">
            <PrimaryButton to="/try">Try a visit note →</PrimaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}
