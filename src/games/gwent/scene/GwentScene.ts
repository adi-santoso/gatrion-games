import * as Phaser from "phaser";
import { CREDITS_LINE } from "../artCredits";
import { CARDS, ROWS, ROW_LABEL, SIDE_LABEL, needsTarget } from "../cards";
import type { Row } from "../cards";
import { rowScore, unitValue } from "../engine";
import type { CardInstance, GwentState } from "../engine";
import { cardSlotIn, frameFor, handSlotIn } from "./layout";
import type { Band, Frame, Orientation } from "./layout";

export interface SceneView {
  game: GwentState;
  pending: string | null;
  playerTurn: boolean;
}

export interface SceneHandlers {
  /** Kartu tanpa sasaran langsung dimainkan. */
  onPlay(uid: string): void;
  /** Kartu efek yang butuh baris (cuaca/terompet) dipilih dulu. */
  onSelect(uid: string): void;
  onPickTarget(row: Row): void;
  onCancel(): void;
  onPass(): void;
  onRestart(): void;
  onReady(): void;
}

const INK = "#ece9df";
const SOFT = "#c9d6c3";
const MUTED = "#9db299";
const LIME = "#c8f36a";
const AMBER = "#f0c778";
const PANEL = 0x121f18;
const EDGE = 0x2b3f31;
const FONT = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, ui-monospace, monospace";

export class GwentScene extends Phaser.Scene {
  private view: SceneView | null = null;
  private parts: Phaser.GameObjects.GameObject[] = [];
  private readonly frame: Frame;

  constructor(
    private handlers: { current: SceneHandlers },
    orientation: Orientation = "landscape",
  ) {
    super("gwent");
    this.frame = frameFor(orientation);
  }

  preload(): void {
    for (const card of Object.values(CARDS)) {
      this.load.svg(`card-${card.id}`, card.art, { width: 168, height: 168 });
    }
  }

  create(): void {
    this.handlers.current.onReady();
    this.redraw();
  }

  setView(view: SceneView): void {
    this.view = view;
    if (this.sys.isActive()) this.redraw();
  }

  private track<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.parts.push(object);
    return object;
  }

  private panel(
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    color: number,
    alpha = 1,
  ) {
    const graphics = this.track(this.add.graphics());
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(x, y, w, h, radius);
    graphics.lineStyle(1, EDGE, 0.9);
    graphics.strokeRoundedRect(x, y, w, h, radius);
    return graphics;
  }

  private label(
    x: number,
    y: number,
    text: string,
    size: number,
    color = INK,
    family = FONT,
    weight = "600",
  ) {
    return this.track(
      this.add.text(x, y, text, {
        fontFamily: family,
        fontSize: `${size}px`,
        color,
        fontStyle: weight === "400" ? "normal" : "bold",
      }),
    );
  }

  private redraw(): void {
    const view = this.view;
    if (!view) return;

    for (const part of this.parts) part.destroy();
    this.parts = [];

    const { game, pending, playerTurn } = view;
    const f = this.frame;

    // Latar: dua bauran warna samar supaya papan tidak terasa datar. Panel
    // baris digambar opak di atasnya agar teks tetap kontras.
    this.track(this.add.rectangle(0, 0, f.width, f.height, 0x0b1512).setOrigin(0));
    const glow = this.track(this.add.graphics());
    glow.fillStyle(0x2f6b3c, 0.16);
    glow.fillCircle(f.width * 0.18, f.height * 0.12, f.width * 0.16);
    glow.fillStyle(0x1f4a58, 0.14);
    glow.fillCircle(f.width * 0.88, f.height * 0.92, f.width * 0.2);

    this.label(f.margin, 10, "DUEL KARTU", 15, INK, FONT, "700");
    this.label(f.margin, 30, "tiga baris · dua ronde untuk menang", 9, MUTED, MONO, "400");

    // Penanda ronde.
    for (let index = 0; index < 3; index += 1) {
      const cx = f.width - 152 + index * 16;
      const filled = index < game.round;
      const dot = this.track(this.add.circle(cx, 24, 5, filled ? 0xc8f36a : 0x30402f));
      dot.setStrokeStyle(1, filled ? 0xc8f36a : 0x425340, 0.9);
    }
    this.label(
      f.width - 88,
      12,
      `${game.wins.player}–${game.wins.ai}`,
      13,
      INK,
      MONO,
      "700",
    );

    for (const band of f.bands) {
      this.panel(band.x, band.y, band.width, band.height, 10, PANEL, 0.97);

      this.label(band.x + 10, band.y + 9, ROW_LABEL[band.row].toUpperCase(), 9, MUTED, MONO, "400");
      const score = rowScore(game, band.side, band.row);
      this.label(
        band.x + 10,
        band.y + 25,
        String(score),
        17,
        score > 0 ? LIME : MUTED,
        MONO,
        "700",
      );

      this.label(
        band.x + 10,
        band.y + band.height - 15,
        SIDE_LABEL[band.side],
        8,
        MUTED,
        MONO,
        "400",
      );

      const row = game.boards[band.side].rows[band.row];
      row.forEach((inst, index) => {
        this.drawRowCard(band, inst, index, row.length);
      });
    }

    // Baris tengah: cuaca, giliran, tombol lewat.
    const middleY = f.middleY;
    const weather =
      game.weather.length === 0
        ? "cuaca cerah"
        : `cuaca: ${game.weather.map((row) => ROW_LABEL[row]).join(" · ")}`;
    this.label(f.margin, middleY, weather, 10, MUTED, MONO, "400");
    this.label(
      f.width / 2,
      middleY - 2,
      game.status === "over"
        ? "selesai"
        : game.passed.player
          ? "kamu lewat"
          : game.turn === "player"
            ? "giliranmu"
            : "lawan berpikir…",
      11,
      INK,
      MONO,
      "600",
    ).setOrigin(0.5, 0);

    this.drawButton(f.width - 108, middleY - 10, 96, 28, "LEWAT", LIME, playerTurn, () =>
      this.handlers.current.onPass(),
    );

    // Baris sasaran untuk kartu efek.
    if (pending) {
      const y = f.targetY;
      const startX = f.orientation === "portrait" ? 72 : 120;
      const step = f.orientation === "portrait" ? 92 : 96;
      this.label(f.margin, y - 18, "PILIH BARIS", 10, AMBER, MONO, "600");
      ROWS.forEach((row, index) => {
        this.drawButton(startX + index * step, y, 88, 28, ROW_LABEL[row].toUpperCase(), AMBER, true, () =>
          this.handlers.current.onPickTarget(row),
        );
      });
      this.drawButton(startX + ROWS.length * step, y, 74, 28, "BATAL", MUTED, true, () =>
        this.handlers.current.onCancel(),
      );
    }

    // Kartu tangan.
    const hand = game.boards.player.hand;
    hand.forEach((inst, index) => {
      const slot = handSlotIn(f, index, hand.length);
      this.drawHandCard(inst, slot.x, slot.y, pending === inst.uid, playerTurn);
    });

    if (hand.length === 0 && game.status === "playing") {
      this.label(f.width / 2, f.handY, "tangan kosong", 10, MUTED, MONO, "400").setOrigin(0.5);
    }

    const credits = this.label(
      f.width - f.margin,
      f.creditsY,
      CREDITS_LINE,
      8,
      MUTED,
      MONO,
      "400",
    );
    credits.setOrigin(1, 1);
    credits.setWordWrapWidth(f.contentWidth);

    if (game.status === "over") this.drawResult();
  }

  private drawRowCard(band: Band, inst: CardInstance, index: number, count: number): void {
    const f = this.frame;
    const slot = cardSlotIn(f, band, index, count);
    const { w, h } = f.rowCard;
    const container = this.track(this.add.container(slot.x, slot.y));

    const bg = this.add.graphics();
    bg.fillStyle(PANEL, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    bg.lineStyle(1, inst.card.kind === "hero" ? 0xc8f36a : EDGE, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 7);
    container.add(bg);

    const art = this.add
      .image(0, -h * 0.22, `card-${inst.card.id}`)
      .setDisplaySize(w * 0.55, w * 0.55);
    art.setTint(inst.card.kind === "hero" ? 0xc8f36a : 0xdfe8cf);
    container.add(art);

    container.add(
      this.add
        .text(0, 0, String(unitValue(this.view!.game, band.side, band.row, inst.card)), {
          fontFamily: MONO,
          fontSize: `${Math.round(w * 0.26)}px`,
          color: LIME,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0),
    );

    const name = inst.card.name.length > 12 ? `${inst.card.name.slice(0, 11)}…` : inst.card.name;
    container.add(
      this.add
        .text(0, h * 0.25, name, {
          fontFamily: FONT,
          fontSize: `${Math.round(w * 0.16)}px`,
          color: SOFT,
          align: "center",
          wordWrap: { width: w - 6 },
          maxLines: 2,
        })
        .setOrigin(0.5, 0),
    );
  }

  private drawHandCard(inst: CardInstance, x: number, y: number, selected: boolean, enabled: boolean) {
    const f = this.frame;
    const { w, h } = f.handCard;
    const container = this.track(this.add.container(x, y));

    const bg = this.add.graphics();
    bg.fillStyle(selected ? 0x20362a : PANEL, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    bg.lineStyle(selected ? 2 : 1, selected ? 0xc8f36a : EDGE, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 9);
    container.add(bg);

    container.add(
      this.add
        .image(0, -h * 0.22, `card-${inst.card.id}`)
        .setDisplaySize(w * 0.5, w * 0.5)
        .setTint(0xdfe8cf),
    );

    container.add(
      this.add
        .text(0, h * 0.04, String(inst.card.strength ?? "✦"), {
          fontFamily: MONO,
          fontSize: `${Math.round(w * 0.21)}px`,
          color: inst.card.kind === "hero" ? AMBER : LIME,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0),
    );

    container.add(
      this.add
        .text(0, f.orientation === "portrait" ? h * 0.15 : h * 0.22, inst.card.name, {
          fontFamily: FONT,
          fontSize: `${Math.max(8, Math.round(w * 0.12))}px`,
          color: INK,
          align: "center",
          wordWrap: { width: w - 8 },
          maxLines: 2,
        })
        .setOrigin(0.5, 0),
    );

    container.add(
      this.add
        .text(0, h / 2 - (f.orientation === "portrait" ? 12 : 13), inst.card.row ? ROW_LABEL[inst.card.row].toUpperCase() : "EFEK", {
          fontFamily: MONO,
          fontSize: "8px",
          color: MUTED,
        })
        .setOrigin(0.5, 0),
    );

    if (!enabled) container.setAlpha(0.6);

    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );

    if (enabled) {
      container.on("pointerover", () => {
        container.setScale(1.06);
        container.setDepth(5);
      });
      container.on("pointerout", () => {
        container.setScale(1);
        container.setDepth(0);
      });
      container.on("pointerdown", () => {
        if (needsTarget(inst.card)) this.handlers.current.onSelect(inst.uid);
        else this.handlers.current.onPlay(inst.uid);
      });
    }
  }

  private drawButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    color: string,
    enabled: boolean,
    onClick: () => void,
  ) {
    const container = this.track(this.add.container(x + w / 2, y + h / 2));
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x3a4c3c, 1);
    bg.fillStyle(0x1b2d22, enabled ? 0.95 : 0.6);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 13);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 13);
    container.add(bg);
    container.add(
      this.add
        .text(0, 0, text, {
          fontFamily: MONO,
          fontSize: "10px",
          color,
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

    if (!enabled) {
      container.setAlpha(0.5);
      return;
    }

    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    container.on("pointerover", () => container.setScale(1.03));
    container.on("pointerout", () => container.setScale(1));
    container.on("pointerdown", onClick);
  }

  private drawResult(): void {
    const view = this.view!;
    const f = this.frame;
    this.track(this.add.rectangle(0, 0, f.width, f.height, 0x06100b, 0.82).setOrigin(0));

    const title =
      view.game.winner === "player"
        ? "KAMU MENANG"
        : view.game.winner === "ai"
          ? "LAWAN MENANG"
          : "SERI";
    this.label(
      f.width / 2,
      f.height / 2 - 60,
      title,
      f.orientation === "portrait" ? 26 : 30,
      LIME,
      FONT,
      "700",
    ).setOrigin(0.5);

    const detail = `ronde ${view.game.wins.player}–${view.game.wins.ai}${
      view.game.roundResult ? ` · terakhir ${view.game.roundResult.player}–${view.game.roundResult.ai}` : ""
    }`;
    this.label(f.width / 2, f.height / 2 - 18, detail, 11, INK, MONO, "400").setOrigin(0.5);

    this.drawButton(f.width / 2 - 70, f.height / 2 + 16, 140, 32, "MAIN LAGI", LIME, true, () =>
      this.handlers.current.onRestart(),
    );
  }
}
