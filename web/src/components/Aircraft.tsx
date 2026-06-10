import type { Aircraft } from "../lib/useRf";

/** Live ADS-B aircraft table — the payoff of the 1090 MHz missions. */
export default function AircraftTable({ list }: { list: Aircraft[] }) {
  if (!list.length) {
    return (
      <p className="text-sm text-muted">
        Aucun avion décodé pour l'instant — les trames Mode S arrivent par rafales, laisse tourner
        quelques secondes (une antenne dégagée vers le ciel aide beaucoup).
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted">
            <th className="py-1.5 pr-3">Vol</th>
            <th className="py-1.5 pr-3">ICAO</th>
            <th className="py-1.5 pr-3 text-right">Altitude</th>
            <th className="py-1.5 pr-3 text-right">Vitesse</th>
            <th className="py-1.5 pr-3 text-right">Cap</th>
            <th className="py-1.5 pr-3">Position</th>
            <th className="py-1.5 pr-3 text-right">Msgs</th>
            <th className="py-1.5 text-right">Vu il y a</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.icao} className="border-t border-edge/60 text-slate-300">
              <td className="py-1.5 pr-3 font-semibold text-phos">{a.callsign ?? "—"}</td>
              <td className="py-1.5 pr-3 text-slate-500">{a.icao}</td>
              <td className="py-1.5 pr-3 text-right">
                {a.alt_ft != null ? `${a.alt_ft.toLocaleString("fr-FR")} ft` : "—"}
              </td>
              <td className="py-1.5 pr-3 text-right">{a.speed_kt != null ? `${a.speed_kt.toFixed(0)} kt` : "—"}</td>
              <td className="py-1.5 pr-3 text-right">{a.track_deg != null ? `${a.track_deg.toFixed(0)}°` : "—"}</td>
              <td className="py-1.5 pr-3">
                {a.lat != null && a.lon != null ? `${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}` : "—"}
              </td>
              <td className="py-1.5 pr-3 text-right text-slate-500">{a.msgs}</td>
              <td className="py-1.5 text-right text-slate-500">{a.age_s < 2 ? "à l'instant" : `${a.age_s.toFixed(0)} s`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
