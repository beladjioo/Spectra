import type { Aircraft } from "../lib/useRf";
import { useI18n, STR } from "../lib/i18n";

/** Live ADS-B aircraft table — the payoff of the 1090 MHz missions. */
export default function AircraftTable({ list }: { list: Aircraft[] }) {
  const { t } = useI18n();
  if (!list.length) {
    return <p className="text-sm text-muted">{t(STR.aircraft.empty)}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted">
            <th className="py-1.5 pr-3">{t(STR.aircraft.flight)}</th>
            <th className="py-1.5 pr-3">ICAO</th>
            <th className="py-1.5 pr-3 text-right">{t(STR.aircraft.alt)}</th>
            <th className="py-1.5 pr-3 text-right">{t(STR.aircraft.speed)}</th>
            <th className="py-1.5 pr-3 text-right">{t(STR.aircraft.track)}</th>
            <th className="py-1.5 pr-3">{t(STR.aircraft.pos)}</th>
            <th className="py-1.5 pr-3 text-right">{t(STR.aircraft.msgs)}</th>
            <th className="py-1.5 text-right">{t(STR.aircraft.seen)}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.icao} className="border-t border-edge/60 text-slate-300">
              <td className="py-1.5 pr-3 font-semibold text-phos">{a.callsign ?? "—"}</td>
              <td className="py-1.5 pr-3 text-slate-500">{a.icao}</td>
              <td className="py-1.5 pr-3 text-right">
                {a.alt_ft != null ? `${a.alt_ft.toLocaleString()} ft` : "—"}
              </td>
              <td className="py-1.5 pr-3 text-right">{a.speed_kt != null ? `${a.speed_kt.toFixed(0)} kt` : "—"}</td>
              <td className="py-1.5 pr-3 text-right">{a.track_deg != null ? `${a.track_deg.toFixed(0)}°` : "—"}</td>
              <td className="py-1.5 pr-3">
                {a.lat != null && a.lon != null ? `${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}` : "—"}
              </td>
              <td className="py-1.5 pr-3 text-right text-slate-500">{a.msgs}</td>
              <td className="py-1.5 text-right text-slate-500">
                {a.age_s < 2 ? t(STR.aircraft.now) : `${a.age_s.toFixed(0)} s`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
