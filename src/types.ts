/**
 * Types and interfaces used throughout the game.
 */
import { PlayField, Tetromino } from "./classes";
import { RotationOffset, ScoreTable } from "./constants";

/**
 * Enforces a method that takes in a state and returns a new state.
 */
export interface Effect {
  apply: (s: State) => State;
}

/**
 * Lazy Array Sequence.
 */
export type LazyArraySequence<T> = Readonly<{
  seed: number;
  pointer: number;
  value: T;
  array: ReadonlyArray<T>;
  next: () => LazyArraySequence<T>;
}>;

/**
 * Nullable type.
 */
export type Nullable<T> = T | null;

/**
 * List of accepted keyboard keys
 */
export type Key =
  | "KeyS"
  | "KeyA"
  | "KeyD"
  | "KeyW"
  | "KeyC"
  | "KeyZ"
  | "KeyR"
  | "KeyP"
  | "Enter"
  | "Space"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight";

/**
 * List of accepted key codes
 */
export type KeyEvent = "keydown" | "keyup" | "keypress";

export type ColorRecord = Record<string, RGBA>;
export type ColorRecordValue = ColorRecord[keyof ColorRecord];

/**
 * Rotation direction.
 * 1 = clockwise
 * -1 = counterclockwise
 */
export type RotateDirection = -1 | 1;

export type RotationState = keyof typeof RotationOffset;

export type State = Readonly<{
  /**
   * Currently active tetromino.
   */
  active: Readonly<{
    tetromino: Tetromino;
    ghost: Tetromino;
    lock: Readonly<{
      timerStart: number;
      ready: boolean;
      resettedCount: number;
    }>;
  }>;

  /**
   * Next tetromino.
   */
  next: Readonly<{
    tetromino: Tetromino;
    nextSequence: LazyArraySequence<TetrominoType>;
  }>;

  /**
   * Metrics of the game.
   */
  metrics: Readonly<{
    lockCount: number;
    rowsCleared: number;
    clearAction: Nullable<keyof typeof ScoreTable>;
    prevClearAction: Nullable<keyof typeof ScoreTable>;

    maxCombo: number;
    score: number;
    hiScore: number;
    level: number;
    combo: number;
    previousGravitateTime: number;
    startTime: number;
    currentTime: number;
    endTime: number;
    holdCount: number;
  }>;
  /**
   * Tetromino that is currently being held.
   */
  hold: Readonly<{
    tetromino: Nullable<Tetromino>;
    used: boolean;
  }>;

  /**
   * Playfield, containing all blocks that have been placed.
   */
  playField: PlayField;

  /**
   * Whether the game has ended.
   */
  gameEnd: boolean;
  /**
   * Whether the game is paused.
   */
  gamePaused: boolean;
  /**
   * Whether the game is restarting.
   */
  gameWillRestart: boolean;
}>;

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export type Cell = Readonly<{
  filled: 0 | 1;
  color: Nullable<ColorRecordValue>;
}>;

export type PosArray = Readonly<[x: number, y: number]>;

export type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
