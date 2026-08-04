import { ScrollNarrative } from "./ScrollNarrative";

export function HowItWorksPage() {
  return (
    <main id="main">
      <section className="section-y">
        <div className="shell max-w-3xl">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-5 text-4xl tracking-[-0.02em] text-foreground md:text-h2">
            From a rough note to the next move.
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
            Follow one real visit — Aaron at Northside Cellars — through the BEVI loop.
          </p>
        </div>
      </section>

      <section className="border-t border-hairline pb-12 pt-4">
        <ScrollNarrative />
      </section>
    </main>
  );
}
