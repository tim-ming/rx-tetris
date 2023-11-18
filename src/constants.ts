/** Constants */

import { Pos, Tetromino } from "./classes";
import { Cell, ColorRecord, PosArray, TetrominoType } from "./types";

export const GridSettings = {
  CANVAS_WIDTH: 10,
  CANVAS_HEIGHT: 20,
  PREVIEW_WIDTH: 5,
  PREVIEW_HEIGHT: 5,
  HOLD_WIDTH: 5,
  HOLD_HEIGHT: 5,
} as const;

export const Viewport = {
  CANVAS_WIDTH: 250,
  CANVAS_HEIGHT: 500,
  PREVIEW_WIDTH: 100,
  PREVIEW_HEIGHT: 100,
  HOLD_WIDTH: 100,
  HOLD_HEIGHT: 100,
} as const;

export const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / GridSettings.CANVAS_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / GridSettings.CANVAS_HEIGHT,
} as const;

export const PreviewBlock = {
  WIDTH: Viewport.PREVIEW_WIDTH / GridSettings.PREVIEW_WIDTH,
  HEIGHT: Viewport.PREVIEW_HEIGHT / GridSettings.PREVIEW_HEIGHT,
} as const;

export const HoldBlock = {
  WIDTH: Viewport.HOLD_WIDTH / GridSettings.HOLD_WIDTH,
  HEIGHT: Viewport.HOLD_HEIGHT / GridSettings.HOLD_HEIGHT,
} as const;

export const Colors: Readonly<ColorRecord> = {
  CYAN: "rgba(153, 230, 255, 1)",
  BLUE: "rgba(102, 153, 204, 1)",
  ORANGE: "rgba(255, 102, 51, 1)",
  YELLOW: "rgba(255, 204, 0, 1)",
  GREEN: "rgba(102, 204, 102, 1)",
  PURPLE: "rgba(204, 102, 204, 1)",
  RED: "rgba(255, 77, 77, 1)",
  GRAY: "rgba(204, 204, 204, 1)",
} as const;

export const Settings = {
  TICK: 10,
  LOCK_DELAY: 500,
  LOCK_DELAY_RESET_COUNT: 15,
  GRAVITY_TICK: 500,
  TETROMINO_SPAWN_POS: new Pos(3, -1),
  GRAVITY: new Pos(0, 1),
  LINES_PER_LEVEL: 10,
  LEVEL_MAX: 20,
  LEVEL_START: 1,
  TARGET_FPS: 60,
} as const;

export const GravityLevelTable: Readonly<Record<number, number>> = {
  1: 43,
  2: 38,
  3: 33,
  4: 28,
  5: 23,
  6: 18,
  7: 13,
  8: 8,
  9: 6,
  10: 5,
  11: 5,
  12: 5,
  13: 4,
  14: 4,
  15: 4,
  16: 3,
  17: 3,
  18: 3,
  19: 2,
  20: 2,
} as const;

export const ScoringRules: Readonly<Record<string, number>> = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
  COMBO: 50,
  SOFT_DROP: 1,
  HARD_DROP: 2,
} as const;

export const ScoreTable: Readonly<Record<string, keyof typeof ScoringRules>> = {
  1: "SINGLE",
  2: "DOUBLE",
  3: "TRIPLE",
  4: "TETRIS",
} as const;

export const Controls = {
  HOLD_DELAY: 150,
  HOLD_INTERVAL: 50,
} as const;

export const Tetrominos: Readonly<
  Record<TetrominoType, ReadonlyArray<ReadonlyArray<Cell>>>
> = {
  I: [
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
    [
      { filled: 0, color: null },

      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
    [
      { filled: 0, color: null },
      { filled: 1, color: Colors.CYAN },
      { filled: 1, color: Colors.CYAN },
      { filled: 1, color: Colors.CYAN },
      { filled: 1, color: Colors.CYAN },
    ],
    [
      { filled: 0, color: null },

      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
    [
      { filled: 0, color: null },

      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
  J: [
    [
      { filled: 1, color: Colors.BLUE },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
    [
      { filled: 1, color: Colors.BLUE },
      { filled: 1, color: Colors.BLUE },
      { filled: 1, color: Colors.BLUE },
    ],
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
  L: [
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 1, color: Colors.ORANGE },
    ],
    [
      { filled: 1, color: Colors.ORANGE },
      { filled: 1, color: Colors.ORANGE },
      { filled: 1, color: Colors.ORANGE },
    ],
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
  O: [
    [
      { filled: 0, color: null },

      { filled: 1, color: Colors.YELLOW },
      { filled: 1, color: Colors.YELLOW },
    ],
    [
      { filled: 0, color: null },

      { filled: 1, color: Colors.YELLOW },
      { filled: 1, color: Colors.YELLOW },
    ],
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
  S: [
    [
      { filled: 0, color: null },
      { filled: 1, color: Colors.GREEN },
      { filled: 1, color: Colors.GREEN },
    ],
    [
      { filled: 1, color: Colors.GREEN },
      { filled: 1, color: Colors.GREEN },
      { filled: 0, color: null },
    ],
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
  T: [
    [
      { filled: 0, color: null },
      { filled: 1, color: Colors.PURPLE },
      { filled: 0, color: null },
    ],
    [
      { filled: 1, color: Colors.PURPLE },
      { filled: 1, color: Colors.PURPLE },
      { filled: 1, color: Colors.PURPLE },
    ],
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
  Z: [
    [
      { filled: 1, color: Colors.RED },
      { filled: 1, color: Colors.RED },
      { filled: 0, color: null },
    ],
    [
      { filled: 0, color: null },
      { filled: 1, color: Colors.RED },
      { filled: 1, color: Colors.RED },
    ],
    [
      { filled: 0, color: null },
      { filled: 0, color: null },
      { filled: 0, color: null },
    ],
  ],
} as const;

export const RotationOffset: Readonly<
  Record<number, Readonly<Record<TetrominoType, ReadonlyArray<PosArray>>>>
> = {
  0: {
    J: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    L: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    S: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    T: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    Z: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    I: [
      [0, 0],
      [-1, 0],
      [2, 0],
      [-1, 0],
      [2, 0],
    ],
    O: [[0, 0]],
  },
  1: {
    J: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    L: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    S: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    T: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    Z: [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    I: [
      [0, 0],
      [0, 1],
      [0, 1],
      [0, -1],
      [0, 2],
    ],
    O: [[0, -1]],
  },
  2: {
    J: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    L: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    S: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    T: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    Z: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    I: [
      [0, 0],
      [1, 0],
      [-2, 0],
      [1, 0],
      [-2, 0],
    ],
    O: [[-1, -1]],
  },
  3: {
    J: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    L: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    S: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    T: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    Z: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
    I: [
      [0, 0],
      [0, -1],
      [0, -1],
      [0, 1],
      [0, -2],
    ],
    O: [[-1, 0]],
  },
} as const;
