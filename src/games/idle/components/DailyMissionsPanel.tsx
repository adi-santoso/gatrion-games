import { formatNumber } from "../../../lib/format";
import { DAILY_MISSIONS } from "../economy";
import type { DailyMissionId, IdleSave } from "../types";

interface Props {
  save: IdleSave;
  onClaim: (id: DailyMissionId) => void;
}

export function DailyMissionsPanel({ save, onClaim }: Props) {
  return (
    <section className="idle-activity-panel idle-daily-panel" aria-labelledby="daily-missions-title">
      <div className="idle-utility-heading">
        <h2 id="daily-missions-title">Daily Mission</h2>
        <span className="mono text-[9px] text-muted">{save.dailyMissions.claimed.length}/{DAILY_MISSIONS.length}</span>
      </div>
      <p className="mono mb-2 text-[9px] text-muted">Progres reset pukul 00.00 waktu lokal</p>
      <div className="idle-daily-list">
        {DAILY_MISSIONS.map((mission) => {
          const progress = save.dailyMissions.progress[mission.id];
          const complete = progress >= mission.target;
          const claimed = save.dailyMissions.claimed.includes(mission.id);
          return (
            <article key={mission.id} className="idle-daily-card" data-mission={mission.id}>
              <div className="flex items-start justify-between gap-2">
                <strong className="text-[11px] font-medium">{mission.name}</strong>
                <span className="mono shrink-0 text-[9px] text-muted">{formatNumber(Math.min(progress, mission.target))}/{formatNumber(mission.target)}</span>
              </div>
              <div className="idle-daily-progress">
                <div style={{ width: `${Math.min(100, (progress / mission.target) * 100)}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="mono text-[9px] text-muted">Hadiah {formatNumber(mission.reward)} ✦</span>
                {claimed ? <span className="mono text-[9px] text-lime">Diklaim</span> : complete ? (
                  <button type="button" className="idle-daily-claim" onClick={() => onClaim(mission.id)}>
                    Klaim
                  </button>
                ) : <span className="mono text-[9px] text-muted">Berjalan</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
