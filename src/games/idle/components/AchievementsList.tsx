import { ACHIEVEMENTS } from "../economy";
import type { IdleSave } from "../types";

export function AchievementsList({ save }: { save: IdleSave }) {
  return (
    <ul
      id="achievements"
      className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2"
    >
      {ACHIEVEMENTS.map((achievement) => {
        const unlocked = save.ach.includes(achievement.id);
        return (
          <li
            key={achievement.id}
            data-unlocked={unlocked ? "true" : "false"}
            className={`achv mono flex items-center gap-2 text-[10px] ${
              unlocked ? "" : "text-muted/40"
            }`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: unlocked ? "var(--color-lime)" : "var(--color-line-strong)",
              }}
            />
            <span>{achievement.name}</span>
          </li>
        );
      })}
    </ul>
  );
}
