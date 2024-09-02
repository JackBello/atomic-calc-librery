import { MethodGetControllers, MethodGetState } from "../symbols";
import { AtomicCalc } from "./calc";

export class HandlerCalc {
  protected APP: AtomicCalc;

  protected keyNoActions: Readonly<Record<string, boolean>> = Object.freeze({
    F1: true,
    F2: true,
    F3: true,
    F4: true,
    F5: true,
    F6: true,
    F7: true,
    F8: true,
    F9: true,
    F10: true,
    F11: true,
    F12: true,
    NumLock: true,
    MetaRight: true,
    MetaLeft: true,
    AltLeft: true,
    CapsLock: true,
    Insert: true,
    ScrollLock: true,
    Pause: true,
    ContextMenu: true,
  });

  constructor(app: AtomicCalc) {
    this.APP = app;

    this.loadEvents();
  }

  public loadEvents() {
    const container =
      this.APP[MethodGetControllers]().schema.elements.container;

    window.addEventListener("keydown", (event) => {});

    document.addEventListener("copy", this.distributionCopy);

    container.addEventListener("click", this.distributionClick);
  }

  protected distributionCopy = () => {};

  public selectColumnAndRowCell(location: string) {
    const number = location.replace(/[A-Z]/g, "");
    const char = location.replace(/\d+/g, "");

    const row = this.APP[
      MethodGetControllers
    ]().schema.elements.tableBody.querySelector(`th[data-number="${number}"]`);

    const column = this.APP[
      MethodGetControllers
    ]().schema.elements.tableHead.querySelector(`[data-char="${char}"]`);

    if (!(column instanceof HTMLElement) || !(row instanceof HTMLElement))
      return;

    if (!row.classList.contains("cell-select"))
      row.classList.add("cell-select");

    if (!column.classList.contains("cell-select"))
      column.classList.add("cell-select");
  }

  public unselectColumnAndRowCell() {
    const location = this.APP[MethodGetState]().cell.location;

    const number = location.replace(/[A-Z]/g, "");
    const char = location.replace(/\d+/g, "");

    const row = this.APP[
      MethodGetControllers
    ]().schema.elements.tableBody.querySelector(`th[data-number="${number}"]`);

    const column = this.APP[
      MethodGetControllers
    ]().schema.elements.tableHead.querySelector(`[data-char="${char}"]`);

    if (!(column instanceof HTMLElement) || !(row instanceof HTMLElement))
      return;

    row.classList.remove("cell-select");
    column.classList.remove("cell-select");
  }

  public selectAllCell() {}

  public unselectAllCell() {}

  public selectAllCellByColumn() {}

  public unselectAllCellByColumn() {}

  public selectAllCellByRow(cell: string | HTMLElement) {
    let location: string = "";

    if (typeof cell === "string") {
      location = cell;
      cell = this.APP[
        MethodGetControllers
      ]().schema.elements.tableBody.querySelector(
        `th[data-number="${cell}"]`
      ) as HTMLElement;
    }

    if (!location) location = cell.dataset.number as string;
  }

  public unselectAllCellByRow() {}

  public selectCell(cell: string | HTMLElement) {
    let location: string = "";

    if (typeof cell === "string") {
      location = cell;
      cell = this.APP[
        MethodGetControllers
      ]().schema.elements.tableBody.querySelector(
        `[data-location="${cell}"]`
      ) as HTMLElement;
    }

    if (!location) location = cell.dataset.location as string;

    if (
      this.APP[MethodGetState]().cell.active &&
      this.APP[MethodGetState]().cell.location !== location
    )
      this.unselectCell();

    const { row, column } = cell.dataset as any;

    this.APP[MethodGetState]().cell.active = true;
    this.APP[MethodGetState]().cell.location = location;
    this.APP[MethodGetState]().cell.row = row;
    this.APP[MethodGetState]().cell.column = column;

    const section = cell.querySelector("section");

    if (!(section instanceof HTMLElement)) return;

    section.classList.add("cell-focus");

    this.selectColumnAndRowCell(location);
  }

  public unselectCell() {
    const element = this.APP[
      MethodGetControllers
    ]().schema.elements.tableBody.querySelector(
      `[data-location="${this.APP[MethodGetState]().cell.location}"]`
    ) as HTMLElement;

    const section = element.querySelector("section");

    if (!(section instanceof HTMLElement)) return;

    this.unselectColumnAndRowCell();

    this.APP[MethodGetState]().cell.active = false;
    this.APP[MethodGetState]().cell.location = "";
    this.APP[MethodGetState]().cell.row = "";
    this.APP[MethodGetState]().cell.column = "";

    section.classList.remove("cell-focus");
  }

  public handlerClick_cellNumber(cell: HTMLElement) {
    if (this.APP[MethodGetState]().all) this.unselectAllCell();

    if (this.APP[MethodGetState]().column.active)
      this.unselectAllCellByColumn();

    if (this.APP[MethodGetState]().cell.active) this.unselectCell();

    if (this.APP[MethodGetState]().row.location !== cell.dataset.number)
      this.selectAllCellByRow(cell);
  }

  public handlerClick_cell(cell: HTMLElement, event: MouseEvent) {
    if (this.APP[MethodGetState]().formula) {
      return;
    }

    if (this.APP[MethodGetState]().all) this.unselectAllCell();

    if (this.APP[MethodGetState]().column.active)
      this.unselectAllCellByColumn();

    if (this.APP[MethodGetState]().row.active) this.unselectAllCellByRow();

    if (event.detail === 2) {
    }

    if (
      event.detail === 1 &&
      this.APP[MethodGetState]().cell.location !== cell.dataset.location
    )
      this.selectCell(cell);
  }

  protected distributionClick = (event: MouseEvent) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const cell = target.closest("td");
    const mainCell = target.closest("th");

    if (mainCell && mainCell.dataset.type === "cell-base") {
    }

    if (mainCell && mainCell.dataset.type === "cell-char") {
    }

    if (mainCell && mainCell.dataset.type === "cell-number")
      this.handlerClick_cellNumber(mainCell);

    if (cell && cell.dataset.type === "cell")
      this.handlerClick_cell(cell, event);
  };
}
