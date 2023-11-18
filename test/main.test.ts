/**
 * Tests!
 */
import { assert, describe, expect, it } from "vitest";
import { main } from "../src/main";
import {
  Tetromino,
  Grid,
  PlayField,
  Pos,
  TetrominoBagFactory,
} from "../src/classes";
import { getOffset, getTetromino, makeGrid } from "../src/utils";
import { State, TetrominoType } from "../src/types";
import {
  HardDrop,
  Hold,
  Lock,
  Restart,
  Rotate,
  SoftDrop,
  Tick,
  Translate,
  getFreshState,
} from "../src/state";
import { GridSettings } from "../src/constants";

const filledCells = (grid: Grid) =>
  grid.cells.map((row) => row.map((cell) => cell.filled));

describe("main", () => {
  it("is defined", () => {
    assert.isDefined(main);
  });
});

describe("classes", () => {
  describe("Tetromino", () => {
    it("is defined", () => {
      assert.isDefined(Tetromino);
    });
    it("rotate()", () => {
      const tetromino = new Tetromino(
        new Pos(0, 0),
        new Grid([
          [
            { filled: 1, color: null },
            { filled: 1, color: null },
            { filled: 1, color: null },
          ],
          [
            { filled: 1, color: null },
            { filled: 0, color: null },
            { filled: 0, color: null },
          ],
          [
            { filled: 0, color: null },
            { filled: 0, color: null },
            { filled: 1, color: null },
          ],
        ]),
        "I",
        0
      ).rotate(1);

      expect(filledCells(tetromino.grid)).toEqual([
        [0, 1, 1],
        [0, 0, 1],
        [1, 0, 1],
      ]);

      const O = getTetromino(new Pos(0, 0), "O");
      expect(filledCells(O.rotate(1).grid)).toEqual([
        [0, 0, 0],
        [0, 1, 1],
        [0, 1, 1],
      ]);
      console.log(
        getOffset(O, O.rotate(1)),
        getOffset(O.rotate(1), O.rotate(1).rotate(1))
      );
    });
    it("translate()", () => {
      const tetromino = new Tetromino(
        new Pos(2, 3),
        new Grid([]),
        "I",
        0
      ).translate(new Pos(-1, 5));
      expect(tetromino.pos.x).toEqual(1);
      expect(tetromino.pos.y).toEqual(8);
    });
    it("translateTo()", () => {
      const tetromino = new Tetromino(
        new Pos(5, 100),
        new Grid([]),
        "I",
        0
      ).translateTo(new Pos(1, 1));
      expect(tetromino.pos.x).toEqual(1);
      expect(tetromino.pos.y).toEqual(1);
    });
    it("trimBoundingBox()", () => {
      const I = getTetromino(new Pos(0, 0), "I");
      const T = getTetromino(new Pos(0, 0), "T");
      expect(filledCells(I.trimmed().grid)).toEqual([[1, 1, 1, 1]]);
      expect(filledCells(T.trimmed().grid)).toEqual([
        [0, 1, 0],
        [1, 1, 1],
      ]);
    });
  });

  describe("Grid", () => {
    it("exists()", () => {
      const rows = 5;
      const columns = 5;
      const filled = 1;
      const grid = makeGrid(rows)(columns)(filled)();

      const positionInside = new Pos(2, 3);
      const positionOutside = new Pos(6, 6);

      expect(grid.exists(positionInside)).toBe(true);
      expect(grid.exists(positionOutside)).toBe(false);
    });

    it("modifyGridColor()", () => {
      const rows = 3;
      const columns = 3;
      const filled = 1;
      const grid = makeGrid(rows)(columns)(filled)();

      const color = "rgba(0, 0, 0, 0)";
      const modifiedGrid = grid.modifyGridColor(color)(filled);

      modifiedGrid.cells.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.color).toBe(color);
        });
      });
    });

    it("getCellColor()", () => {
      const rows = 4;
      const columns = 4;
      const filled = 1;
      const grid = makeGrid(rows)(columns)(filled)();

      const color = "rgba(0, 0, 0, 0)";
      const modifiedGrid = grid.modifyGridColor(color)(filled);

      const position = new Pos(2, 2);

      expect(modifiedGrid.getCellColor(position)).toBe(color);
    });

    it("getFill()", () => {
      const rows = 4;
      const columns = 4;
      const filled = 1;
      const grid = makeGrid(rows)(columns)(filled)();

      const position = new Pos(1, 3);

      expect(grid.getFill(position)).toBe(filled);
    });

    it("rotate()", () => {
      const grid = new Grid([
        [
          { filled: 1, color: null },
          { filled: 1, color: null },
        ],
        [
          { filled: 1, color: null },
          { filled: 0, color: null },
        ],
      ]);

      const rotatedGrid = grid.rotate(1);

      expect(rotatedGrid.cells).toEqual([
        [
          { filled: 1, color: null },
          { filled: 1, color: null },
        ],
        [
          { filled: 0, color: null },
          { filled: 1, color: null },
        ],
      ]);
    });

    it("map()", () => {
      const rows = 4;
      const columns = 4;
      const filled = 1;
      const grid = makeGrid(rows)(columns)(filled)();

      const mappedGrid = grid.map((row) =>
        row.map((cell) => ({ ...cell, filled: 0 }))
      );

      mappedGrid.cells.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.filled).toBe(0);
        });
      });
    });
  });

  describe("Pos", () => {
    it("add()", () => {
      const pos1 = new Pos(1, 2);
      const pos2 = new Pos(3, 4);
      const result = pos1.add(pos2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it("minus()", () => {
      const pos1 = new Pos(5, 8);
      const pos2 = new Pos(2, 3);
      const result = pos1.minus(pos2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(5);
    });

    it("scale()", () => {
      const pos = new Pos(2, 3);
      const factor = 3;
      const result = pos.scale(factor);
      expect(result.x).toBe(6);
      expect(result.y).toBe(9);
    });

    it("scaleX", () => {
      const pos = new Pos(3, 6);
      const factor = 2;
      const result = pos.scaleX(factor);
      expect(result.x).toBe(6);
      expect(result.y).toBe(6);
    });

    it("scaleY", () => {
      const pos = new Pos(2, 4);
      const factor = 0.5;
      const result = pos.scaleY(factor);
      expect(result.x).toBe(2);
      expect(result.y).toBe(2);
    });
  });

  describe("PlayField", () => {
    it("merge PlayField equal size", () => {
      const playField = filledCells(
        new PlayField(new Pos(0, 0), makeGrid(5)(5)(0)()).merge(
          getTetromino(new Pos(0, 0), "I")
        ).grid
      );
      expect(playField).toEqual([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ]);
    });
    it("merge PlayField not equal size", () => {
      const playField = filledCells(
        new PlayField(new Pos(0, 0), makeGrid(3)(3)(0)()).merge(
          getTetromino(new Pos(0, 0), "I")
        ).grid
      );
      expect(playField).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 1, 1],
      ]);
    });
    it("multi merge", () => {
      const grid = filledCells(
        new PlayField(new Pos(0, 0), makeGrid(4)(4)(0)())
          .merge(getTetromino(new Pos(0, 0), "Z"))
          .merge(getTetromino(new Pos(1, 2), "T"))
          .merge(getTetromino(new Pos(0, 1), "I")).grid
      );
      expect(grid).toEqual([
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 1],
      ]);
    });
  });
});

describe("utils", () => {
  it("is defined", () => {
    assert.isDefined(makeGrid);
    assert.isDefined(getTetromino);
  });
  it("makeGrid()", () => {
    const grid = makeGrid(4)(4)(0)("rgba(0, 0, 0, 0)");
    expect(grid.cells.map((row) => row.map((cell) => cell.filled))).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(grid.cells.map((row) => row.map((cell) => cell.color))).toEqual([
      [
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
      ],
      [
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
      ],
      [
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
      ],
      [
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
      ],
    ]);
  });
  describe("TetrominoBagFactory", () => {
    it("is defined", () => {
      assert.isDefined(TetrominoBagFactory);
    });
    it("should include all bag items", () => {
      const factory = new TetrominoBagFactory(0);
      expect(TetrominoBagFactory.BAG_ITEMS.length).toEqual(
        factory.next().array.length
      );
    });
    it("should not have duplicate", () => {
      const factory = new TetrominoBagFactory(0);
      expect(new Set(factory.next().array).size).toEqual(
        factory.next().array.length
      );
    });
    it("lazy sequence of values in bag no duplicate", () => {
      const factory = new TetrominoBagFactory(0);
      const bag: string[] = [];
      let next = factory.next();
      for (let i = 0; i < TetrominoBagFactory.BAG_ITEMS.length; i++) {
        bag.push(next.value);
        next = next.next();
      }
      expect(new Set(bag).size).toEqual(TetrominoBagFactory.BAG_ITEMS.length);
    });
    it("shuffling of bag self-replenishes", () => {
      // Uses 10 iterations to hopefully get a good shuffle and not the same
      // This test might fail if TetrominoBagFactory.BAG_ITEMS.length gets too small
      const factory = new TetrominoBagFactory(0);
      const bag: string[] = [];
      const seeds: Set<number> = new Set();
      const bags: Set<TetrominoType[]> = new Set();
      const iterations = 10;
      let next = factory.next();
      for (
        let i = 0;
        i < TetrominoBagFactory.BAG_ITEMS.length * iterations;
        i++
      ) {
        seeds.add(next.seed);
        bag.push(next.value);
        bags.add(next.array.slice(0, next.array.length));
        next = next.next();
      }
      expect(bags.size).toBeGreaterThan(iterations / 2);
      expect(seeds.size).toEqual(iterations);
      expect(new Set(bag).size).toEqual(TetrominoBagFactory.BAG_ITEMS.length);
    });
  });
});

describe("state", () => {
  describe("Hold", () => {
    it("is defined", () => {
      assert.isDefined(Hold);
    });
    it("apply()", () => {
      const state = getFreshState(0);
      expect(new Hold().apply(state).hold.tetromino).toBeTruthy();
    });
    it("holdNext()", () => {
      const state = getFreshState(0);
      expect(Hold.holdNext(state).hold.tetromino).toBeTruthy();
    });
    it("holdActive()", () => {
      const state = getFreshState(0);
      const holdTetromino = getTetromino(new Pos(0, 0), "O");
      const activeTetromino = getTetromino(new Pos(0, 0), "I");
      const s: State = {
        ...state,
        hold: { ...state.hold, tetromino: holdTetromino },
        active: { ...state.active, tetromino: activeTetromino },
      };
      expect(Hold.holdActive(s).hold.tetromino!.type).toEqual(
        activeTetromino.type
      );
    });
  });

  describe("Translate", () => {
    it("is defined", () => {
      assert.isDefined(Translate);
    });
    describe("apply()", () => {
      it("no collision", () => {
        const state = getFreshState(0);
        const prevPos = state.active.tetromino.pos;

        expect(
          new Translate(new Pos(0, 1)).apply(state).active.tetromino.pos
        ).not.toEqual(prevPos);
      });
      it("collision", () => {
        const state = getFreshState(0);
        const prevPos = state.active.tetromino.pos;

        expect(
          new Translate(new Pos(GridSettings.CANVAS_WIDTH + 1, 0)).apply(state)
            .active.tetromino.pos
        ).toEqual(prevPos);
      });
    });
  });

  describe("SoftDrop", () => {
    it("is defined", () => {
      assert.isDefined(SoftDrop);
    });
    describe("apply()", () => {
      it("move", () => {
        const state = getFreshState(0);
        const prevPos = state.active.tetromino.pos;

        expect(
          new SoftDrop(new Pos(0, 1)).apply(state).active.tetromino.pos
        ).not.toEqual(prevPos);
      });
      it("adds score", () => {
        const state = getFreshState(0);
        const prevScore = state.metrics.score;

        expect(
          new SoftDrop(new Pos(0, 1)).apply(state).metrics.score
        ).not.toEqual(prevScore);
      });
    });
  });

  describe("HardDrop", () => {
    it("is defined", () => {
      assert.isDefined(HardDrop);
    });
    describe("apply()", () => {
      it("adds score", () => {
        const state = getFreshState(0);
        const prevScore = state.metrics.score;

        expect(new HardDrop().apply(state).metrics.score).not.toEqual(
          prevScore
        );
      });
    });
  });

  describe("Lock", () => {
    it("is defined", () => {
      assert.isDefined(Lock);
    });
    describe("apply()", () => {
      it("increase lock count", () => {
        const state = getFreshState(0);
        const prevCount = state.metrics.lockCount;
        expect(new Lock().apply(state).metrics.lockCount).not.toEqual(
          prevCount
        );
      });
      it("get next tetromino", () => {
        const state = getFreshState(0);
        const prevTetromino = new Tetromino(
          state.active.tetromino.pos,
          state.active.tetromino.grid,
          state.active.tetromino.type,
          state.active.tetromino.rotationState
        );

        expect(new Lock().apply(state).active.tetromino).not.toEqual(
          prevTetromino
        );
      });
    });
    it("clearFilledRows", () => {
      const state = getFreshState(0);
      const grid = new Grid([
        [
          { filled: 1, color: null },
          { filled: 1, color: null },
          { filled: 1, color: null },
        ],
        [
          { filled: 1, color: null },
          { filled: 0, color: null },
          { filled: 1, color: null },
        ],
        [
          { filled: 1, color: null },
          { filled: 1, color: null },
          { filled: 1, color: null },
        ],
      ]);
      const playField = new PlayField(new Pos(0, 0), grid);
      const s = {
        ...state,
        playField: playField,
      };
      expect(Lock.clearFilledRows(s).playField.grid.cells).toEqual([
        [
          { filled: 0, color: null },
          { filled: 0, color: null },
          { filled: 0, color: null },
        ],
        [
          { filled: 0, color: null },
          { filled: 0, color: null },
          { filled: 0, color: null },
        ],
        [
          { filled: 1, color: null },
          { filled: 0, color: null },
          { filled: 1, color: null },
        ],
      ]);
    });
  });

  describe("Rotate", () => {
    it("is defined", () => {
      assert.isDefined(Rotate);
    });
    describe("apply()", () => {
      it("rotate", () => {
        const state = getFreshState(0);
        const prevRotationState = state.active.tetromino.rotationState;
        expect(
          new Rotate(1).apply(state).active.tetromino.rotationState
        ).not.toEqual(prevRotationState);
      });
      it("rotate back", () => {
        const state = getFreshState(0);
        const prevRotationState = state.active.tetromino.rotationState;
        expect(
          new Rotate(-1).apply(state).active.tetromino.rotationState
        ).not.toEqual(prevRotationState);
      });
      it("rotate back and forth", () => {
        const state = getFreshState(0);
        const prevRotationState = state.active.tetromino.rotationState;
        expect(
          new Rotate(-1).apply(new Rotate(1).apply(state)).active.tetromino
            .rotationState
        ).toEqual(prevRotationState);
      });
    });
  });

  describe("Restart", () => {
    it("is defined", () => {
      assert.isDefined(Restart);
    });
    describe("apply()", () => {
      const state = getFreshState(0);
      const s: State = {
        ...state,
        metrics: {
          ...state.metrics,
          hiScore: 1000,
          score: 1000,
        },
        gameEnd: true,
      };
      const prevScore = s.metrics.score;
      it("score should be 0", () => {
        expect(new Restart().apply(s).metrics.score).toEqual(0);
      });
      it("hiScore should be prevScore", () => {
        expect(new Restart().apply(s).metrics.hiScore).toEqual(prevScore);
      });
      it("gameEnd should be false", () => {
        expect(new Restart().apply(s).gameEnd).toEqual(false);
      });
    });
  });

  describe("Tick", () => {
    it("is defined", () => {
      assert.isDefined(Restart);
    });
    describe("apply()", () => {
      it("should update time", () => {
        const state = getFreshState(0);
        const prevTime = state.metrics.currentTime;
        expect(new Tick(100).apply(state).metrics.currentTime).not.toEqual(
          prevTime
        );
      });
    });
  });
});
