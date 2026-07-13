export default function CargandoDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-luda-lila-light" />
        <div className="h-4 w-48 rounded-lg bg-luda-lila-light/60" />
      </div>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-luda-lila-light/60" />
        ))}
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-luda-lila-light/40" />
        ))}
      </div>
    </div>
  );
}
