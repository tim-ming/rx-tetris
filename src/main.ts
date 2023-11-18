/**
 * Main game loop. This is where the magic happens!
 * Represents the Controller in MVC.
 */
import {
  EMPTY,
  Subscription,
  fromEvent,
  interval,
  merge,
  of,
  timer,
} from "rxjs";
import {
  combineLatestWith,
  filter,
  map,
  mergeAll,
  scan,
  startWith,
  switchMap,
  takeUntil,
  withLatestFrom,
} from "rxjs/operators";
import { Controls, Settings } from "./constants";
import { Pos } from "./classes";
import {
  HardDrop,
  Hold,
  Pause,
  Restart,
  Rotate,
  SoftDrop,
  Tick,
  Translate,
  initialState,
  reduceState,
} from "./state";
import "./style.css";
import { Key, KeyEvent } from "./types";
import { View } from "./view";

export function main() {
  const view = new View();

  /**
   * Standard One-time Key Event
   * @param event Key event
   * @param keyCodes List of accepted key codes
   * @returns Observable of key event
   */
  const fromKeyNoRepeat = (event: KeyEvent, keyCodes: Key[]) =>
    fromEvent<KeyboardEvent>(document, event).pipe(
      filter(({ code }) => keyCodes.includes(code as Key)),
      filter(({ repeat }) => !repeat)
    );

  /**
   * Key event, can be used for hold without delay, or Delayed Auto Shift (DAS)
   * A stream that emits the return value of the provided function and then emits
   * in intervals after a delay.
   * @param keyCodes List of accepted key codes
   * @param f Function to be executed
   * @param delay_ms Delay in milliseconds
   * @returns
   */
  const fromHold = <T>(keyCodes: Key[], f: () => T, delay_ms: number) =>
    fromKeyNoRepeat("keydown", keyCodes).pipe(
      map(() =>
        // interval with initial delay
        timer(delay_ms, Controls.HOLD_INTERVAL).pipe(
          // overwrite initial delay with startWith
          startWith(f()),
          map(f),
          takeUntil(
            fromEvent<KeyboardEvent>(document, "keyup").pipe(
              filter(({ code }) => keyCodes.includes(code as Key))
            )
          )
        )
      ),
      mergeAll() // merge all observables from map
    );

  const w$ = fromKeyNoRepeat("keydown", ["KeyW", "ArrowUp"]).pipe(
    map(() => new Rotate(1))
  );
  const a$ = fromHold(
    ["KeyA", "ArrowLeft"],
    () => new Translate(new Pos(-1, 0)),
    Controls.HOLD_DELAY
  );
  const s$ = fromHold(
    ["KeyS", "ArrowDown"],
    () => new SoftDrop(new Pos(0, 1)),
    0
  );
  const d$ = fromHold(
    ["KeyD", "ArrowRight"],
    () => new Translate(new Pos(1, 0)),
    Controls.HOLD_DELAY
  );
  const z$ = fromKeyNoRepeat("keydown", ["KeyZ"]).pipe(
    map(() => new Rotate(-1))
  );
  const r$ = fromKeyNoRepeat("keypress", ["KeyR"]).pipe(
    map(() => new Restart())
  );
  const c$ = fromKeyNoRepeat("keypress", ["KeyC"]).pipe(map(() => new Hold()));
  const space$ = fromKeyNoRepeat("keypress", ["Space"]).pipe(
    map(() => new HardDrop())
  );

  const tick$ = interval(Settings.TICK);

  // Create a pausable stream to represent the game state
  const pause$ = fromKeyNoRepeat("keydown", ["KeyP"]).pipe(
    scan((isPaused) => !isPaused, false),
    startWith(false)
  );

  const gameTick$ = tick$.pipe(
    // Combine the pause$ and tick$ observables to keep track of
    // the pause state and elapsed time separately
    combineLatestWith(pause$),

    // Manually accumulate the elapsed time while the game is not paused
    scan(
      (acc, [__, isPaused]): [number, boolean] => {
        const [elapsedTime, _] = acc;
        return [elapsedTime + (isPaused ? 0 : Settings.TICK), isPaused];
      },
      [0, false] as [number, boolean]
    ),

    // Only emit tick when the game is not paused
    switchMap(([elapsedTime, isPaused]) =>
      isPaused ? [new Pause(true)] : [new Pause(false), new Tick(elapsedTime)]
    )
  );

  const controls$ = merge(w$, a$, s$, c$, d$, r$, z$, space$).pipe(
    // get latest value of pause$ on each key press
    withLatestFrom(pause$),

    // respond to controls only if not paused
    switchMap(([control, isPaused]) => (isPaused ? EMPTY : of(control)))
  );

  const gameState$ = merge(gameTick$, controls$).pipe(
    scan(reduceState, initialState) // Accumulate game state changes
  );

  const subscription: Subscription = gameState$.subscribe((s) => {
    view.render(s);
  });
}

if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
