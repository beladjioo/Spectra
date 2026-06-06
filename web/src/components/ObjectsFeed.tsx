import type { DeviceEvent } from "../lib/useSpectra";

export default function ObjectsFeed({ devices }: { devices: DeviceEvent[] }) {
  if (!devices.length) {
    return (
      <div className="text-sm text-slate-500">
        Aucun objet décodé pour l'instant. Passe en mode Weather (ou ajoute l'ADS-B)
        et les objets capturés apparaîtront ici avec leurs valeurs.
      </div>
    );
  }
  return (
    <div className="max-h-72 space-y-1 overflow-auto font-mono text-xs">
      {devices.map((d, i) => (
        <div key={i} className="flex gap-2 rounded bg-ink/60 px-2 py-1">
          <span className="text-slate-500">
            {new Date((d.ts ?? 0) * 1000).toLocaleTimeString()}
          </span>
          <span className="rounded bg-edge px-1.5 text-accent">{d.kind}</span>
          <span className="truncate text-slate-300">{JSON.stringify(d.decode)}</span>
        </div>
      ))}
    </div>
  );
}
