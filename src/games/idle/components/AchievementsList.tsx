import { ACHIEVEMENTS } from "../economy";
import type { IdleSave } from "../types";

export function AchievementsList({ save }: { save: IdleSave }) {
  return (
    <ul id="achievements" className="medal-grid mt-2">
      {ACHIEVEMENTS.map((achievement) => {
        const unlocked = save.ach.includes(achievement.id);
        return (
          <li
            key={achievement.id}
            data-unlocked={unlocked ? "true" : "false"}
            className="medal"
          >
            <span aria-hidden="true" className="medal-dot" />
            <span>{achievement.name}</span>
          </li>
        );
      })}
    </ul>
  );
}
