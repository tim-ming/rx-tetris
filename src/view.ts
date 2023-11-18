/**
 * View module. Where all the creative stuff happens!
 * Represents the view of the game.
 */
import { Block, HoldBlock, PreviewBlock, Viewport } from "./constants";
import { ColorRecordValue, Nullable, State } from "./types";
import { formatTime } from "./utils";

export class View {
  readonly svg: SVGGraphicsElement & HTMLElement;
  readonly preview: SVGGraphicsElement & HTMLElement;
  readonly hold: SVGGraphicsElement & HTMLElement;
  readonly gameover: HTMLElement;
  readonly container: HTMLElement;
  readonly pausedOverlay: HTMLElement;

  // Text fields
  readonly levelText: HTMLElement;
  readonly comboText: HTMLElement;
  readonly scoreText: HTMLElement;
  readonly highScoreText: HTMLElement;
  readonly clearAction: HTMLElement;

  constructor() {
    // Canvas elements
    this.svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
      HTMLElement;
    this.preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
      HTMLElement;
    this.hold = document.querySelector("#svgHold") as SVGGraphicsElement &
      HTMLElement;
    this.gameover = document.querySelector("#gameOver") as HTMLElement;
    this.container = document.querySelector("#main") as HTMLElement;
    this.clearAction = document.querySelector("#clearAction") as HTMLElement;
    this.pausedOverlay = document.querySelector(
      "#pausedOverlay"
    ) as HTMLElement;

    // Text fields
    this.levelText = document.querySelector("#levelText") as HTMLElement;
    this.comboText = document.querySelector("#comboText") as HTMLElement;
    this.scoreText = document.querySelector("#scoreText") as HTMLElement;
    this.highScoreText = document.querySelector(
      "#highScoreText"
    ) as HTMLElement;

    this.svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    this.svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

    this.preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
    this.preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

    this.hold.setAttribute("height", `${Viewport.HOLD_HEIGHT}`);
    this.hold.setAttribute("width", `${Viewport.HOLD_WIDTH}`);
  }

  /**
   * Renders the view of game state.
   * @param s game State
   * @returns void
   */
  render = (s: State) => {
    if (s.gamePaused) {
      this.unhide(this.pausedOverlay);
      return;
    }
    this.hide(this.pausedOverlay);
    if (s.gameEnd) {
      this.unhide(this.gameover);
      this.updateStatistics(s);
      return;
    }
    this.hide(this.gameover);
    this.updateTextFields(s);
    this.updateCanvas(s);
    this.updatePreview(s);
    this.updateHold(s);
  };

  /**
   * Unhides a HTML element.
   * @param elem HTML element to unhide
   */
  unhide = (elem: HTMLElement) => {
    elem.style.visibility = "visible";
  };

  /**
   * Hides a HTML element
   * @param elem HTML element to hide
   */
  hide = (elem: HTMLElement) => {
    elem.style.visibility = "hidden";
  };

  /**
   * Updates player statistics.
   * @param s game State
   */
  updateStatistics = (s: State): void => {
    const highScoreElement = document.getElementById("metricHighScore")!;

    const maxComboElement = document.getElementById("metricMaxCombo")!;

    const currentLevelElement = document.getElementById("metricCurrentLevel")!;
    const timePlayedElement = document.getElementById("metricTimePlayed")!;

    const scoreElement = document.getElementById("metricScore")!;
    const piecesElement = document.getElementById("metricPieces")!;
    const piecesPerMinuteElement = document.getElementById(
      "metricPiecesPerMinute"
    );
    const linesElement = document.getElementById("metricLines")!;
    const linesPerMinuteElement = document.getElementById(
      "metricLinesPerMinute"
    )!;
    const holdsElement = document.getElementById("metricHolds")!;
    const timePlayedMs = s.metrics.endTime - s.metrics.startTime;

    scoreElement.innerHTML = `Total Score: ${s.metrics.score}`;
    highScoreElement.innerHTML = `High Score: ${s.metrics.hiScore}`;

    maxComboElement.innerHTML = `Max Combo: ${s.metrics.maxCombo}`;

    currentLevelElement.innerHTML = `Current Level: ${s.metrics.level}`;

    piecesElement.innerHTML = `Pieces: ${s.metrics.lockCount}`;

    // Calculate pieces per minute and format it
    const piecesPerMinute = s.metrics.lockCount / (timePlayedMs / 60000);
    piecesPerMinuteElement!.innerHTML = `Pieces Per Minute: ${piecesPerMinute.toFixed(
      2
    )}`;

    linesElement.innerHTML = `Lines: ${s.metrics.rowsCleared}`;
    // Calculate lines per minute and format it
    const linesPerMinute = s.metrics.rowsCleared / (timePlayedMs / 60000);
    linesPerMinuteElement!.innerHTML = `Lines Per Minute: ${linesPerMinute.toFixed(
      2
    )}`;

    holdsElement.innerHTML = `Holds: ${s.metrics.holdCount}`;

    // Calculate time played (currentTime - startTime) and format it
    timePlayedElement.innerHTML = `Time Played: ${formatTime(
      timePlayedMs / 1000
    )}`;
  };

  /**
   * Creates an SVG element with the given properties.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
   * element names and properties.
   *
   * @param namespace Namespace of the SVG element
   * @param name SVGElement name
   * @param props Properties to set on the SVG element
   * @returns SVG element
   */
  createSvgElement = (
    namespace: Nullable<string>,
    name: string,
    props: Record<string, string> = {}
  ) => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
  };

  /**
   * Creates an SVG block.
   * @param x x coordinate of the SVG Block
   * @param y y coordinate of the SVG Block
   * @param offsetX x offset of the SVG Block
   * @param offsetY y offset of the SVG Block
   * @param blockWidth width of the block
   * @param blockHeight height of the block
   * @param color color of the block
   * @returns SVGElement block
   */
  createBlock = (
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
    blockWidth: number,
    blockHeight: number,
    color: Nullable<ColorRecordValue> = null
  ) =>
    this.createSvgElement(this.svg.namespaceURI, "rect", {
      height: `${blockHeight}`,
      width: `${blockWidth}`,
      x: `${blockWidth * x + offsetX}`,
      y: `${blockHeight * y + offsetY}`,
      style: color ? `fill: ${color}` : "fill: transparent",
    });

  /**
   * Update text fields
   * @param s game State
   */
  updateTextFields = (s: State) => {
    this.levelText.innerText = `${s.metrics.level}`;
    this.comboText.innerText = `${s.metrics.combo}`;
    const clearActionText = document.createElement("p");
    clearActionText.id = s.metrics.clearAction ? s.metrics.clearAction : "";
    clearActionText.innerHTML = s.metrics.clearAction
      ? s.metrics.clearAction
      : "";
    this.clearAction.replaceChildren(clearActionText);
    this.scoreText.innerText = s.metrics.score.toString().padStart(8, "0");
    this.highScoreText.innerText = `${s.metrics.hiScore}`;
  };

  /**
   * Updates canvas view, including playfield and active tetromino
   * @param s game State
   */
  updateCanvas = (s: State) => {
    this.svg.replaceChildren(
      ...s.playField
        .merge(s.active.tetromino)
        .merge(s.active.ghost)
        .grid.cells.flatMap(
          (row, row_index) =>
            row
              .map((cell, col_index) =>
                cell.filled
                  ? this.createBlock(
                      col_index,
                      row_index,
                      0,
                      0,
                      Block.WIDTH,
                      Block.HEIGHT,
                      cell.color
                    )
                  : null
              )
              .filter((res) => res !== null) as SVGGraphicsElement[]
        )
    );
  };

  /**
   * Updates preview view
   * @param s game State
   */
  updatePreview = (s: State) => {
    // trim to center
    const trimmedNext = s.next.tetromino.trimmed();
    this.preview.replaceChildren(
      ...trimmedNext.grid.cells.flatMap(
        (row, row_index) =>
          row
            .map((cell, col_index) =>
              cell.filled
                ? this.createBlock(
                    col_index,
                    row_index,
                    (Viewport.PREVIEW_WIDTH -
                      trimmedNext.grid.cells[0].length * PreviewBlock.WIDTH) /
                      2,
                    (Viewport.PREVIEW_HEIGHT -
                      trimmedNext.grid.cells.length * PreviewBlock.HEIGHT) /
                      2,
                    PreviewBlock.WIDTH,
                    PreviewBlock.HEIGHT,
                    cell.color
                  )
                : null
            )
            .filter((res) => res !== null) as SVGGraphicsElement[]
      )
    );
  };

  /**
   * Updates hold view
   * @param s game State
   */
  updateHold = (s: State) => {
    if (s.hold.tetromino !== null) {
      // trim to center
      const trimmedHold = s.hold.tetromino.trimmed();
      this.hold.replaceChildren(
        ...trimmedHold.grid.cells.flatMap(
          (row, row_index) =>
            row
              .map((cell, col_index) =>
                cell.filled
                  ? this.createBlock(
                      col_index,
                      row_index,
                      (Viewport.HOLD_WIDTH -
                        trimmedHold.grid.cells[0].length * HoldBlock.WIDTH) /
                        2,
                      (Viewport.HOLD_HEIGHT -
                        trimmedHold.grid.cells.length * HoldBlock.HEIGHT) /
                        2,
                      HoldBlock.WIDTH,
                      HoldBlock.HEIGHT,
                      cell.color
                    )
                  : null
              )
              .filter((res) => res !== null) as SVGGraphicsElement[]
        )
      );
    } else {
      this.hold.replaceChildren();
    }
  };
}
