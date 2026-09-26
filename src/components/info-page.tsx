type InfoSection = { title: string; body: string };

export function InfoPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: InfoSection[] }) {
  return (
    <main>
      <section className="border-b border-line bg-canvas"><div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">{title}</h1><p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p></div></section>
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-12 sm:px-6 sm:py-16">{sections.map((section) => <article key={section.title} className="rounded-xl border border-line bg-paper p-6"><h2 className="font-display text-2xl font-semibold text-navy">{section.title}</h2><p className="mt-3 leading-relaxed text-muted">{section.body}</p></article>)}</section>
    </main>
  );
}
