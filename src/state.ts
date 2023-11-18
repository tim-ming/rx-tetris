/**
 * State. Represents the Model of the game.
 */
import {
  Grid,
  PlayField,
  Pos,
  Tetromino,
  TetrominoBagFactory,
} from "./classes";
import { GridSettings, ScoreTable, ScoringRules, Settings } from "./constants";
import { Cell, Effect, RotateDirection, State } from "./types";
import {
  ifElse,
  flip,
  getGravity,
  getTetromino,
  makeGrid,
  not,
  pipe,
  getOffset,
} from "./utils";

/**
 * Hold class. Allows for holding a tetromino.
 */
export class Hold implements Effect {
  constructor() {}
  apply = (s: State): State =>
    !s.hold.used
      ? pipe(
          s,
          ifElse(
            () => s.hold.tetromino === null,
            Hold.holdNext,
            Hold.holdActive
          ),
          Lock.resetLock,
          updateGhost
        )
      : s;

  /**
   * Holds the next tetromino.
   * @param s current state
   * @returns Updated state with hold tetromino
   */
  static holdNext = (s: State): State =>
    pipe(
      {
        ...s,
        active: {
          ...s.active,
          tetromino: s.next.tetromino,
        },
        next: {
          tetromino: getTetromino(
            Settings.TETROMINO_SPAWN_POS,
            s.next.nextSequence.value
          ),
          nextSequence: s.next.nextSequence.next(),
        },
        hold: {
          tetromino: getTetromino(
            Settings.TETROMINO_SPAWN_POS,
            s.active.tetromino.type
          ),
          used: true,
        },
      },
      Hold.addHoldCount
    );

  /**
   * Holds the active tetromino.
   * @param s current state
   * @returns Updated state with hold tetromino
   */
  static holdActive = (s: State): State =>
    s.hold.tetromino === null
      ? s
      : pipe(
          {
            ...s,
            active: {
              ...s.active,
              tetromino: s.hold.tetromino,
            },
            hold: {
              tetromino: getTetromino(
                Settings.TETROMINO_SPAWN_POS,
                s.active.tetromino.type
              ),
              used: true,
            },
          },
          Hold.addHoldCount
        );

  /**
   * Adds hold count.
   * @param s current state
   * @returns updated state with holdCount + 1
   */
  static addHoldCount = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      holdCount: s.metrics.holdCount + 1,
    },
  });
}

/**
 * Translates the active tetromino.
 * @param pos Position to translate by
 */
export class Translate implements Effect {
  constructor(public readonly pos: Pos) {}
  /**
   * Updates the state by translating the active tetromino.
   *
   * @param s Current state
   * @returns Updated state
   */
  apply = (s: State): State =>
    !s.gameEnd && not(colliding(s))(s.active.tetromino.translate(this.pos))
      ? pipe(s, translate(this.pos), Lock.updateLock, updateGhost)
      : s;
}

/**
 * Translates the active tetromino.
 * @param pos Position to translate by
 */
export class SoftDrop implements Effect {
  constructor(public readonly pos: Pos) {}
  /**
   * Updates the state by translating the active tetromino.
   *
   * @param s Current state
   * @returns Updated state
   */
  apply = (s: State): State =>
    !s.gameEnd && not(colliding(s))(s.active.tetromino.translate(this.pos))
      ? pipe(
          s,
          addScore(ScoringRules.SOFT_DROP),
          translate(this.pos),
          Lock.updateLock,
          updateGhost
        )
      : s;
}

/**
 * Hard drop class. Allows for hard dropping the active tetromino.
 */
export class HardDrop implements Effect {
  constructor() {}
  apply = (s: State): State =>
    !s.gameEnd
      ? pipe(
          s,
          translate(s.active.ghost.pos.minus(s.active.tetromino.pos)), // translate to ghost pos
          addScore(ScoringRules.HARD_DROP),
          new Lock().apply
        )
      : s;
}

/**
 * Updates the state by placing the active tetromino, going to next.
 * (Updates ghost)
 */
export class Lock implements Effect {
  constructor() {}
  /**
   * Updates the state by translating the active tetromino.
   *
   * @param s Current state
   * @returns Updated state
   */
  apply = (s: State): State =>
    !s.gameEnd
      ? pipe(
          s,
          Lock.incrementLockCount,
          Lock.unlockHold,
          Lock.merge,
          Lock.resetLock,
          Lock.clearFilledRows,
          Lock.updateLevel,
          Lock.nextTetromino,
          updateGhost,
          Lock.updateLock
        )
      : s;

  /**
   * Increment lockCount.
   * @param s game State
   * @returns Updated game State with lockCount + 1
   */
  static incrementLockCount = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      lockCount: s.metrics.lockCount + 1,
    },
  });

  /**
   * Unlocks hold.
   * @param s game State
   * @returns Updated game State with hold.used = false
   */
  static unlockHold = (s: State): State => ({
    ...s,
    hold: {
      ...s.hold,
      used: false,
    },
  });
  /**
   * Merges active tetromino into playField.
   * @param s game State
   * @returns Updated game State with active tetromino merged into playField
   */
  static merge = (s: State): State => ({
    ...s,
    playField: s.playField.merge(s.active.tetromino),
  });

  /**
   * Updates level based on rowsCleared.
   * @param s game State
   * @returns Updated game State with level updated based on rowsCleared
   */
  static updateLevel = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      level: Math.min(
        Settings.LEVEL_MAX,
        initialState.metrics.level +
          Math.floor(s.metrics.rowsCleared / Settings.LINES_PER_LEVEL)
      ),
    },
  });
  /**
   * Reset lock.
   * @param s game State
   * @returns Updated game State with resettedCount = 0, ready = false
   */
  static resetLock = (s: State): State => ({
    ...s,
    active: {
      ...s.active,
      lock: {
        ...s.active.lock,
        resettedCount: 0,
        ready: false,
      },
    },
  });

  /**
   * Ends the game.
   * @param s game State
   * @returns Updated game State with gameEnd = true
   */
  static endGame = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      endTime: s.metrics.currentTime,
      hiScore:
        s.metrics.score > s.metrics.hiScore
          ? s.metrics.score
          : s.metrics.hiScore,
    },
    gameEnd: true,
  });

  /**
   * Switches to next tetromino, if it is colliding with the playField, game over.
   * @param s game State
   * @returns Updated game State
   */
  static nextTetromino = (s: State): State =>
    colliding(s)(s.next.tetromino)
      ? // if colliding with the next tetromino, game over
        this.endGame(s)
      : // else, go to next tetromino
        {
          ...s,
          active: {
            ...s.active,
            tetromino: s.next.tetromino,
          },
          next: {
            tetromino: getTetromino(
              Settings.TETROMINO_SPAWN_POS,
              s.next.nextSequence.value
            ),
            nextSequence: s.next.nextSequence.next(),
          },
        };

  /**
   * Resets combo
   * @param s game State
   * @returns Updated game State with combo = 0
   */
  static resetCombo = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      combo: 0,
    },
  });

  /**
   * Updates combo
   * @param s game State
   * @returns Updated game State with combo + 1, maxCombo = max(combo, maxCombo)
   */
  static updateCombo = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      combo: s.metrics.combo + 1,
      maxCombo: Math.max(s.metrics.maxCombo, s.metrics.combo + 1),
    },
  });

  /**
   * Clears fully filled rows from the tetromino & updates score
   * @param s game State
   * @returns new tetromino
   */
  static clearFilledRows = (s: State): State => {
    // get not fully filled rows
    const newCells = s.playField.grid.cells.filter(
      (row) => !row.every((cell) => cell.filled)
    );

    const rowsCleared = s.playField.grid.cells.length - newCells.length;

    if (rowsCleared <= 0) {
      return Lock.resetCombo(s);
    } else {
      const newPlayField = new PlayField(
        s.playField.pos,
        makeGrid(s.playField.grid.cells.length)(
          s.playField.grid.cells[0].length
        )(0)()
      )
        // merge the upper cells with the new playfield
        .merge(
          new Tetromino(
            s.playField.pos.add(
              new Pos(0, s.playField.grid.cells.length - newCells.length)
            ),
            new Grid(newCells),
            "I", // can use anything, it does not matter
            0
          )
        );
      return pipe(
        {
          ...s,
          playField: newPlayField,
          metrics: {
            ...s.metrics,
            clearAction: ScoreTable[rowsCleared],
            rowsCleared: s.metrics.rowsCleared + rowsCleared,
          },
        },
        this.updateCombo,
        this.gainScore(rowsCleared)
      );
    }
  };
  /**
   * Updates score with combo and rows cleared
   * @param rowsCleared Number of rows cleared
   * @param s Game state
   * @returns Updated game state
   */
  static gainScore =
    (rowsCleared: number) =>
    (s: State): State =>
      addScore(
        (Lock.getScoreSimple(rowsCleared) +
          ScoringRules.COMBO * s.metrics.combo) *
          s.metrics.level
      )(s);

  /**
   * Gets the score for clearing rows.
   * @param rowsCleared number of rows cleared
   * @returns score
   */
  static getScoreSimple = (rowsCleared: number): number =>
    ScoringRules[ScoreTable[rowsCleared]];

  /**
   * Updates lock state. If tetromino will collide with playField on (new Pos(0,1)), set lock to ready.
   * If lock is ready, it will delay the lock until delay count if resettedCount is valid.
   * @param s
   * @returns
   */
  static updateLock = (s: State): State =>
    s.active.lock.ready
      ? this.resetLockTimer(s)
      : ifElse(
          flip(colliding)(s.active.tetromino.translate(new Pos(0, 1))),
          this.startLockTimer,
          this.resetLock
        )(s);

  /**
   * Readies the lock, and starts the lock timer.
   * @param s game State
   * @returns Updated game State
   */
  static startLockTimer = (s: State): State => ({
    ...s,
    active: {
      ...s.active,
      lock: {
        ...s.active.lock,
        timerStart: s.metrics.currentTime,
        ready: true,
      },
    },
  });

  /**
   * Resets the lock timer, if lock is ready and if can still reset.
   * @param s game State
   * @returns Updated game State
   */
  static resetLockTimer = (s: State): State =>
    s.active.lock.ready &&
    s.active.lock.resettedCount < Settings.LOCK_DELAY_RESET_COUNT
      ? {
          ...s,
          active: {
            ...s.active,
            lock: {
              ...s.active.lock,
              timerStart: s.metrics.currentTime,
              resettedCount: s.active.lock.resettedCount + 1,
            },
          },
        }
      : s;
}

/**
 * Rotates the active tetromino.
 * @param rotateDirection direction to rotate
 */
export class Rotate implements Effect {
  constructor(public readonly rotateDirection: RotateDirection) {}

  apply = (s: State): State =>
    !s.gameEnd ? pipe(s, this.rotate, updateGhost, Lock.updateLock) : s;

  /**
   * Rotates the active tetromino if it won't collide with playField.
   * @param s current State
   * @returns Updated State
   */
  rotate = (s: State): State => {
    const rotatedTetromino = s.active.tetromino.rotate(this.rotateDirection);
    const rotationOffset = getOffset(s.active.tetromino, rotatedTetromino).find(
      (offset) => not(colliding(s))(rotatedTetromino.translate(offset))
    );

    return rotationOffset
      ? pipe(
          {
            ...s,
            active: {
              ...s.active,
              tetromino: rotatedTetromino,
            },
          },
          translate(rotationOffset)
        )
      : s;
  };
}
export class Pause implements Effect {
  constructor(public readonly pause: boolean) {}
  apply = (s: State): State => ({
    ...s,
    gamePaused: this.pause,
  });
}
/**
 * Restart class, allows for restarting the game.
 */
export class Restart implements Effect {
  constructor() {}

  apply = (s: State): State =>
    s.gameEnd ? pipe(s, this.restart, updateGhost) : s;

  /**
   * Restarts the game.
   * @param s game State
   * @returns Updated game State
   */
  restart = (s: State): State => ({
    ...initialState,
    active: {
      ...initialState.active,
      tetromino: s.next.tetromino,
    },
    next: {
      tetromino: getTetromino(
        Settings.TETROMINO_SPAWN_POS,
        s.next.nextSequence.value
      ),
      nextSequence: s.next.nextSequence.next(),
    },
    metrics: {
      ...initialState.metrics,
      hiScore: s.metrics.hiScore,
      previousGravitateTime: s.metrics.currentTime, // reset previousGravitateTime, if not it will gravitate unexpectedly
      startTime: s.metrics.currentTime,
    },
    gameEnd: false,
  });
}

/**
 * Tick class, manages the game loop.
 * @param elapsed time elapsed since the start of the game
 */
export class Tick implements Effect {
  constructor(public readonly elapsed: number) {}

  apply = (s: State): State =>
    !s.gameEnd
      ? pipe(s, this.lock, this.updateTime, this.gravitate)
      : this.updateTime(s);

  /**
   * Locks the active tetromino if it is ready, and if lock delay timer is met.
   * @param s game State
   * @returns Updated game State
   */
  lock = (s: State): State => {
    const lockTimeup =
      s.metrics.currentTime - s.active.lock.timerStart > Settings.LOCK_DELAY;
    return s.active.lock.ready &&
      lockTimeup &&
      colliding(s)(s.active.tetromino.translate(new Pos(0, 1)))
      ? new Lock().apply(s)
      : s;
  };

  /**
   * Gravitates the active tetromino if the next gravitate time is met.
   * @param s game State
   * @returns Updated game State
   */
  gravitate = (s: State): State => {
    const nextGravitate =
      (getGravity(s.metrics.level) / Settings.TARGET_FPS) * 1000;
    return s.metrics.currentTime - s.metrics.previousGravitateTime >
      nextGravitate
      ? pipe(
          {
            ...s,
            metrics: {
              ...s.metrics,
              previousGravitateTime:
                s.metrics.previousGravitateTime + nextGravitate,
            },
          },
          new Translate(Settings.GRAVITY).apply
        )
      : s;
  };

  /**
   * Updates the current time.
   * @param s game State
   * @returns Updated game State
   */
  updateTime = (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      currentTime: this.elapsed,
    },
  });
}

/**
 * Checks if the active tetromino is colliding with the playField.
 * @param s current State
 * @returns true if the active tetromino is colliding with the playField
 */
export const colliding =
  (s: State) =>
  (tetromino: Tetromino): boolean =>
    s.playField.isColliding(tetromino);

/**
 * Adds score to the current score.
 * @param s current State
 * @returns Updated State
 */
export const addScore =
  (score: number) =>
  (s: State): State => ({
    ...s,
    metrics: {
      ...s.metrics,
      score: s.metrics.score + score,
    },
  });

/**
 * Returns Ghost position of the active tetromino (only for y-axis)
 * @param s game State
 * @returns Ghost position of the active tetromino (only for y-axis)
 */
export const getGhost = (s: State): Tetromino => {
  // recursively translate downward until colliding
  const ghostAux = (playField: PlayField, tetromino: Tetromino): Tetromino =>
    colliding(s)(tetromino)
      ? tetromino.translate(new Pos(0, -1))
      : ghostAux(playField, tetromino.translate(new Pos(0, 1)));

  return ghostAux(
    new PlayField(
      s.playField.pos,
      s.playField.grid.map(
        (row: ReadonlyArray<Cell>): ReadonlyArray<Cell> =>
          // optimise, use only the part of the grid columns that is needed
          row.slice(
            s.active.tetromino.pos.x,
            s.active.tetromino.pos.x + s.active.tetromino.grid.cells[0].length
          )
      )
    ),
    new Tetromino(
      s.active.tetromino.pos.add(new Pos(0, 1)),
      s.active.tetromino.grid.modifyGridColor(null)(1), // ghost no color
      s.active.tetromino.type,
      s.active.tetromino.rotationState
    )
  );
};

/**
 * Updates the ghost of the active tetromino.
 * @param s game State
 * @returns Updated game State
 */
export const updateGhost = (s: State): State => ({
  ...s,
  active: {
    ...s.active,
    ghost: getGhost(s),
  },
});

/**
 * Translates the active tetromino if won't collide with playField.
 * @param s Current State
 * @param pos Position to translate by
 * @returns Updated State
 */
export const translate =
  (pos: Pos) =>
  (s: State): State => {
    const translatedTetromino = s.active.tetromino.translate(pos);
    if (not(colliding(s))(translatedTetromino)) {
      return {
        ...s,
        active: {
          ...s.active,
          tetromino: translatedTetromino,
        },
      };
    } else {
      return s;
    }
  };

/**
 * Creates a fresh state.
 * @param seed
 * @returns
 */
export const getFreshState = (seed: number): State => {
  /**
   * Initial state of the game.
   */
  const tetrominoFactory = new TetrominoBagFactory(seed);
  const firstSequence = tetrominoFactory.next();
  const nextSequence = firstSequence.next();

  return updateGhost({
    active: {
      tetromino: getTetromino(
        Settings.TETROMINO_SPAWN_POS,
        firstSequence.value
      ),
      ghost: getTetromino(Settings.TETROMINO_SPAWN_POS, firstSequence.value),
      lock: {
        ready: false,
        resettedCount: 0,
        timerStart: 0,
      },
    },
    next: {
      tetromino: getTetromino(Settings.TETROMINO_SPAWN_POS, nextSequence.value),
      nextSequence: nextSequence.next(),
    },
    metrics: {
      lockCount: 0,
      rowsCleared: 0,
      clearAction: null,
      prevClearAction: null,
      maxCombo: 0,
      score: 0,
      hiScore: 0,
      level: Settings.LEVEL_START,
      combo: 0,
      previousGravitateTime: 0,
      startTime: 0,
      currentTime: 0,
      endTime: 0,
      holdCount: 0,
    },
    hold: {
      tetromino: null,
      used: false,
    },
    gameEnd: false,
    gamePaused: false,
    gameWillRestart: false,
    playField: new PlayField(
      new Pos(0, 0),
      makeGrid(GridSettings.CANVAS_HEIGHT)(GridSettings.CANVAS_WIDTH)(0)()
    ),
  } as const);
};

/**
 * Initial state of the game.
 */
const initialState: State = getFreshState(Math.random() * 1000000);

/**
 * State transducer
 * @param s input State
 * @param effect type of Effect to apply to the State
 * @returns a new State
 */
const reduceState = (s: State, e: Effect) => e.apply(s);

export { initialState, reduceState };
