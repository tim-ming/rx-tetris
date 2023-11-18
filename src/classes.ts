/**
 * Property classes used in the game.
 */
export { Grid, Pos, Tetromino, TetrominoBagFactory, PlayField };
import { RotationOffset } from "./constants";
import {
  Cell,
  ColorRecordValue,
  LazyArraySequence,
  Nullable,
  RotateDirection,
  RotationState,
  TetrominoType,
} from "./types";
import { RNG } from "./utils";

/**
 * TetrominoBagFactory class, contains a seed to generate a new bag.
 * @param seed seed to generate a new bag
 */
class TetrominoBagFactory {
  public static readonly BAG_ITEMS: TetrominoType[] = [
    "I",
    "J",
    "L",
    "O",
    "S",
    "T",
    "Z",
  ];
  constructor(public readonly seed: number) {}

  /**
   * Returns a new lazy array sequence of tetrominoes for a bag system to ensure
   * that all tetrominoes are used before repeating. Bag self-replenishes after
   * exhaustion. Can be repeatedly called to retrieve a new sequence.
   */
  next = () =>
    (function _next(
      seed: number,
      pointer: number,
      array: ReadonlyArray<TetrominoType>
    ): LazyArraySequence<TetrominoType> {
      // get a new shuffled array after exhausting all tetrominoes (a bag)
      if (pointer >= array.length) {
        const shuffledArray = RNG.shuffle(
          RNG.hash(seed),
          TetrominoBagFactory.BAG_ITEMS
        );
        return {
          seed: RNG.hash(seed),
          pointer: 0,
          value: shuffledArray[0],
          array: shuffledArray,
          next: () => _next(RNG.hash(seed), 1, shuffledArray),
        } as const;
      }
      // else get the next tetromino in the bag (array)
      else {
        return {
          seed: seed,
          pointer: pointer,
          value: array[pointer],
          array: array,
          next: () => _next(seed, pointer + 1, array),
        } as const;
      }
    })(this.seed, 0, RNG.shuffle(this.seed, TetrominoBagFactory.BAG_ITEMS));
}

/**
 * Position class, determines the position of an Object.
 * @param x x-coordinate
 * @param y y-coordinate
 */
class Pos {
  constructor(public readonly x: number, public readonly y: number) {}

  add = (other: Pos) => new Pos(this.x + other.x, this.y + other.y);

  minus = (other: Pos) => new Pos(this.x - other.x, this.y - other.y);

  scale = (factor: number) => new Pos(this.x * factor, this.y * factor);

  scaleY = (factor: number) => new Pos(this.x, this.y * factor);

  scaleX = (factor: number) => new Pos(this.x * factor, this.y);
}

/**
 * Grid class, contains a matrix of fill and color using parallel arrays.
 */
class Grid {
  constructor(public readonly cells: ReadonlyArray<ReadonlyArray<Cell>>) {}

  /**
   * Checks if a position is within the grid.
   * @param pos Pos to check
   * @returns true if the position is within the grid
   */
  exists = (pos: Pos) =>
    pos.y >= 0 &&
    pos.y < this.cells.length &&
    pos.x >= 0 &&
    pos.x < this.cells[0].length;

  /**
   * Returns a new grid with the specified color for the filled value
   */
  modifyGridColor = (color: Nullable<ColorRecordValue>) => (filled: 0 | 1) =>
    new Grid(
      this.cells.map((row) =>
        row.map((cell) =>
          cell.filled == filled
            ? {
                ...cell,
                color: color,
              }
            : cell
        )
      )
    );

  /**
   * Gets the cell color at the position, if out of bounds, return null.
   * @param pos position to get the cell color at
   * @returns Cell color at the position, if out of bounds, return null.
   */
  getCellColor = (pos: Pos) =>
    this.exists(pos) ? this.cells[pos.y][pos.x].color : null;

  /**
   * Gets the fill at the position, if out of bounds, return null.
   * @param pos position to get the fill at
   * @returns Fill at the position, if out of bounds, return null.
   */
  getFill = (pos: Pos) =>
    this.exists(pos) ? this.cells[pos.y][pos.x].filled : 0;

  /**
   * Rotates the grid
   * @param rotateDirection direction to rotate
   * @returns Rotated grid
   */
  rotate = (rotateDirection: RotateDirection) =>
    new Grid(
      this.cells.map((row, col_index) =>
        row.map(
          (cell, row_index) =>
            this.cells[
              rotateDirection == 1
                ? this.cells.length - 1 - row_index
                : row_index
            ][
              rotateDirection == 1
                ? col_index
                : this.cells[0].length - 1 - col_index
            ]
        )
      )
    );

  /**
   * Maps the grid to a new grid.
   * @param f Function to map
   * @returns new grid
   */
  map = (f: (cell: ReadonlyArray<Cell>) => ReadonlyArray<Cell>) =>
    new Grid(this.cells.map(f));
}

/**
 * The playfield.
 * Contains a grid and a position.
 * @param pos position of the playfield
 * @param grid grid of the playfield
 * @returns a playfield
 */
class PlayField {
  public readonly height: number;
  public readonly width: number;
  constructor(public readonly pos: Pos, public readonly grid: Grid) {
    this.height = grid.cells.length;
    this.width = grid.cells[0].length;
  }

  /**
   * Adds the other tetromino to the Playfield.
   * @param other tetromino to add
   * @returns new tetromino
   */
  merge = (other: Tetromino) =>
    new PlayField(
      this.pos,
      new Grid(
        this.grid.cells.map((row, y) =>
          row.map((cell, x) => ({
            filled:
              cell.filled ||
              // map position correctly
              other.grid.getFill(this.pos.minus(other.pos).add(new Pos(x, y))),
            color:
              cell.color ||
              other.grid.getCellColor(
                // map position correctly
                this.pos.minus(other.pos).add(new Pos(x, y))
              ),
          }))
        )
      )
    );

  /**
   * Checks if the Tetromino is colliding with the blocks in the Playfield, or is outside the Tetrion (the border).
   * @param tetromino tetromino to check collision with
   * @returns true if the tetromino is colliding with the Playfield or the Tetrion
   */
  isColliding = (tetromino: Tetromino) =>
    tetromino.grid.cells.some((row, y) =>
      row.some(
        (cell, x) =>
          cell.filled &&
          (this.grid.getFill(
            tetromino.pos.minus(this.pos).add(new Pos(x, y))
          ) ||
            this.IsOutsideTetrion(
              tetromino.pos.minus(this.pos).add(new Pos(x, y))
            ))
      )
    );

  /**
   * Checks if the pos is outside of the Tetrion (the border).
   * @param tetromino
   * @returns true if the tetromino is colliding with the Tetrion
   */
  IsOutsideTetrion = (pos: Pos) =>
    pos.y >= this.height - this.pos.y ||
    pos.x >= this.width - this.pos.x ||
    pos.x <= this.pos.x - 1;
}

/**
 * A tetromino contains a grid, position of the grid.
 */
class Tetromino {
  constructor(
    public readonly pos: Pos,
    public readonly grid: Grid,
    public readonly type: TetrominoType,
    public readonly rotationState: RotationState
  ) {}

  /**
   * Translates the tetromino by a position.
   * @param pos position to translate by
   * @returns new tetromino
   */
  translate = (pos: Pos): Tetromino =>
    new Tetromino(this.pos.add(pos), this.grid, this.type, this.rotationState);

  /**
   * Translates to a position.
   * @param pos position to translate to
   * @returns new tetromino
   */
  translateTo = (pos: Pos): Tetromino =>
    new Tetromino(
      this.pos.add(pos.minus(this.pos)),
      this.grid,
      this.type,
      this.rotationState
    );

  /**
   * Adds rotation state in specified direction, wrapping rotate.
   * @param rotateDirection
   * @returns rotation state after addition
   */
  addRotationState = (rotateDirection: RotateDirection): RotationState => {
    const numberOfStates = Object.keys(RotationOffset).length;
    // wrap around number of states
    return this.rotationState + rotateDirection < 0
      ? (numberOfStates + (rotateDirection % numberOfStates)) % numberOfStates
      : (this.rotationState + rotateDirection) % numberOfStates;
  };

  /**
   * Rotates the tetromino by 90 degrees counter-clockwise.
   * @param direction direction to rotate
   * @returns new tetromino
   */
  rotate = (rotateDirection: RotateDirection): Tetromino =>
    new Tetromino(
      this.pos,
      this.grid.rotate(rotateDirection),
      this.type,
      this.addRotationState(rotateDirection)
    );

  /**
   * Returns a bounding-box-trimmed Tetromino
   * @returns a bounding-box-trimmed Tetromino
   */
  trimmed = (): Tetromino => {
    // get all filled coordinates with row and column indices
    const filledCoords = this.grid.cells
      .flatMap((row, rowIndex) =>
        row.map(({ filled }, colIndex) => ({ filled, rowIndex, colIndex }))
      )
      .filter(({ filled }) => filled == 1);

    // initialise bounding box
    const acc: [minX: number, maxX: number, minY: number, maxY: number] = [
      this.grid.cells.length - 1,
      0,
      this.grid.cells[0].length - 1,
      0,
    ];

    // find bounding box with row and column indices
    const boundingBox = filledCoords.reduce(
      (acc, { rowIndex, colIndex }) =>
        [
          acc[0] < rowIndex ? acc[0] : rowIndex,
          acc[1] > rowIndex ? acc[1] : rowIndex,
          acc[2] < colIndex ? acc[2] : colIndex,
          acc[3] > colIndex ? acc[3] : colIndex,
        ] as [minX: number, maxX: number, minY: number, maxY: number],
      acc
    );

    // trim the grid to bounding box
    const trimmedGrid = new Grid(
      this.grid.cells
        .slice(boundingBox[0], boundingBox[1] + 1)
        .map((row) => row.slice(boundingBox[2], boundingBox[3] + 1))
    );
    return new Tetromino(this.pos, trimmedGrid, this.type, this.rotationState);
  };
}
