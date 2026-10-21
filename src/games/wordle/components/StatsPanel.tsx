import { MAX_GUESSES } from "../engine";
import type { Dictionary, Lang, LangStats } from "../types";

interface Props {
  stats: LangStats;
  lang: Lang;
  dictionary: Dictionary | null;
}

export function StatsPanel({ stats, lang, dictionary }: Props) {
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  const max = Math.max(1, ...stats.dist);

  return (
    <aside className="space-y-8">
      <div>
        <h2 className="mono flex items-baseline justify-between border-b border-line pb-2 text-[11px] text-muted">
          <span>statistik</span>
          <span className="text-muted/60">{lang}</span>
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
          <Metric value={stats.played} label="main" />
          <Metric value={`${winRate}%`} label="menang" />
          <Metric value={stats.streak} label="streak" />
          <Metric value={stats.best} label="terbaik" />
        </div>
        <div className="mono mt-4 flex items-center justify-between border-t border-line pt-3 text-[10px] text-muted">
          <span>harian beruntun</span>
          <span className="text-ink" data-testid="daily-streak">
            {stats.daily.streak}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mono border-b border-line pb-2 text-[11px] text-muted">
          selesai di tebakan
        </h2>
        <div className="mt-4 space-y-2">
          {Array.from({ length: MAX_GUESSES }, (_, index) => {
            const count = stats.dist[index] ?? 0;
            return (
              <div key={index} className="flex items-center gap-2.5">
                <span className="mono w-2 text-[10px] text-muted">{index + 1}</span>
                <div className="bar flex-1">
                  <span style={{ width: `${Math.round((count / max) * 100)}%` }} />
                </div>
                <span className="mono w-4 text-right text-[10px] text-muted">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mono space-y-1 text-[10px] leading-relaxed text-muted/70">
        <p>kamus</p>
        {dictionary ? (
          <p className="text-muted">
            {lang}{" "}
            {(dictionary.meta.answers ?? dictionary.answers.length).toLocaleString("id-ID")} jawaban ·{" "}
            {(dictionary.meta.guesses ?? dictionary.guesses.length).toLocaleString("id-ID")} tebakan
          </p>
        ) : (
          <p className="text-muted">memuat kamus…</p>
        )}
      </div>
    </aside>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="display text-2xl">{value}</div>
      <div className="mono mt-0.5 text-[10px] text-muted">{label}</div>
    </div>
  );
}
