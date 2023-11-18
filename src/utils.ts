/**
 * Utility functions.
 */
import { Observable, map, scan } from "rxjs";
import { Grid, Pos, Tetromino } from "./classes";
import { GravityLevelTable, RotationOffset, Tetrominos } from "./constants";
import { Cell, ColorRecordValue, Nullable, TetrominoType } from "./types";

/************** FP helpers ******************/

// From: https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h
type AnyFunc = (...arg: any) => any;

// From: https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h
type PipeArgs<F extends AnyFunc[], Acc extends AnyFunc[] = []> = F extends [
  (...args: infer A) => infer B
]
  ? [...Acc, (...args: A) => B]
  : F extends [(...args: infer A) => any, ...infer Tail]
  ? Tail extends [(arg: infer B) => any, ...any[]]
    ? PipeArgs<Tail, [...Acc, (...args: A) => B]>
    : Acc
  : Acc;

// From: https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h
type LastFnReturnType<F extends Array<AnyFunc>, Else = never> = F extends [
  ...any[],
  (...arg: any) => infer R
]
  ? R
  : Else;

/**
 * Takes a binary function and returns a new function that takes its arguments in reverse order.
 * @param {function} f - The binary function to flip.
 * @returns {function} A new function that takes the arguments of `f` in reverse order.
 */
export const flip =
  <T, V, U>(f: (a: T) => (b: V) => U) =>
  (a: V) =>
  (b: T) =>
    f(b)(a);

/**
 * Pipe operator, similar to the one in RxJS.
 * From: https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h
 */
export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  arg: Parameters<FirstFn>[0],
  firstFn: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): LastFnReturnType<F, ReturnType<FirstFn>> {
  return (fns as AnyFunc[]).reduce((acc, fn) => fn(acc), firstFn(arg));
}

/**
 * If else function. If condition is true, apply f, else apply g.
 * @param condition Condition to check
 * @param flip Function to true if condition is true
 */
export const ifElse: <T>(
  condition: (arg: T) => boolean,
  f: (arg: T) => T,
  g: (arg: T) => T
) => (arg: T) => T = (condition, f, g) => (arg) =>
  condition(arg) ? f(arg) : g(arg);

/**
 * Returns inverse of the specified boolean function.
 * @param f a function returning boolean
 * @param x the value that will be tested with f
 */
export const not =
  <T>(f: (x: T) => boolean) =>
  (x: T) =>
    !f(x);

/************** Utility helpers ****************/

/**
 * Creates a grid of the specified size, filled with the specified value and color.
 */
export const makeGrid =
  (rows: number) =>
  (columns: number) =>
  (filled: 0 | 1) =>
  (color: Nullable<ColorRecordValue> = null) =>
    new Grid(
      Array.from({ length: rows }, () =>
        Array.from(
          { length: columns },
          () => ({ filled: filled, color: color } as Cell)
        )
      )
    );

/**
 * Creates a Tetromino of the specified type at the specified position.
 * @param pos Position of the Tetromino
 * @param type Type of the Tetromino
 * @returns Tetromino of the Tetromino
 */
export const getTetromino = (pos: Pos, type: TetrominoType) =>
  new Tetromino(pos, new Grid(Tetrominos[type]), type, 0);

/**
 * Returns the gravity of the specified level.
 * @param level Level to get the gravity of
 * @returns Gravity of the specified level
 * @throws Error if the level is invalid
 */
export const getGravity = (level: number) => {
  if (level in GravityLevelTable) {
    return GravityLevelTable[level];
  } else {
    throw new Error("Invalid level");
  }
};

/**
 * Get the offset differences between the current tetromino
 * and the rotated tetromino from the RotationOffset table.
 * @param current Current tetromino
 * @param rotated Rotated tetromino
 * @returns An array of Pos representing the differences between the current tetromino and the rotated tetromino.
 */
export const getOffset = (current: Tetromino, rotated: Tetromino) => {
  const currentOffsets = RotationOffset[current.rotationState][current.type];
  const rotatedOffsets = RotationOffset[rotated.rotationState][rotated.type];
  return currentOffsets.map((offset, index) =>
    new Pos(...offset).minus(new Pos(...rotatedOffsets[index])).scaleY(-1)
  );
};

/**
 * Format time in seconds to "mm:ss.ms" format
 * @param seconds time in seconds
 * @returns formatted time
 */
export const formatTime = (seconds: number) => {
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.trunc(seconds % 60);
  const ms = Number((seconds % 1).toFixed(3)) * 1000;
  return `${String(minutes)}:${String(secs).padStart(2, "0")}.${String(
    ms
  ).padStart(3, "0")}`;
};

/***************** RNG *****************/

/**
 * A random number generator which provides five pure functions:
 * `hash`, `scale`, `intRange`, `randomInsert`, `shuffle`.
 * Referenced from FIT2102 Tutorial 4
 */
export abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Takes hash value and scales it to the range [0, 1]
   * @param hash hash value
   * @returns a number in the range [0, 1]
   */
  public static scale = (hash: number) => hash / (RNG.m - 1);

  /**
   * Takes hash value and scales it to the range int [min, max (exclusive)]
   * @param seed seed for the random number generator
   * @param min minimum value
   * @param max maximum value (exclusive)
   * @returns a number in the range [min, max (exclusive)]
   */
  public static intRange = (seed: number, min: number, max: number) =>
    Math.floor(this.scale(this.hash(seed)) * (max - min) + min);

  /**
   * Inserts an element into an array at a random index.
   * @param seed seed for the random number generator
   * @param a Array to insert into
   * @param e Element to insert
   * @returns a new array with the element inserted at a random index
   */
  public static randomInsert = <T>(
    seed: number,
    a: ReadonlyArray<T>,
    e: T
  ): ReadonlyArray<T> => {
    const i = this.intRange(seed, 0, a.length);
    return [...a.slice(0, i), e, ...a.slice(i)];
  };

  /**
   * Shuffles an array.
   * @param seed seed for the random number generator
   * @param a Array to shuffle
   * @returns a new array with the elements shuffled
   */
  public static shuffle = <T>(seed: number, a: ReadonlyArray<T>) => {
    return a.reduce<ReadonlyArray<T>>(
      (acc, e) => RNG.randomInsert(this.hash(seed + acc.length), acc, e),
      [] as ReadonlyArray<T>
    );
  };
}
