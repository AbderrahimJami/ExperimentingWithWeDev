export default function AuthLayout({
  title,
  subtitle,
  sideTitle,
  sideCopy,
  sideHighlights = [],
  children,
}) {
  return (
    <div className="relative">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">
              WeDev Auth
            </p>
            <h1 className="mt-3 font-display text-3xl text-ink">{title}</h1>
            <p className="mt-3 text-slate">{subtitle}</p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-ink p-8 text-sand shadow-soft">
            <h2 className="font-display text-xl">{sideTitle}</h2>
            <p className="mt-3 text-sm text-sand/80">{sideCopy}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {sideHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-sun" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="rounded-3xl border border-white/60 bg-white/85 p-8 shadow-soft backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  )
}
