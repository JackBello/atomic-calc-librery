import {
  MethodGetControllers,
  MethodGetData,
  MethodGetState,
} from "../symbols";
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

  protected distributionCopy = async () => {
    let copy = "";

    const data = this.APP[MethodGetData]();

    if (this.APP[MethodGetState]().row.active) {
      const row = this.APP[MethodGetState]().row.row as number;

      data[row].forEach((state) => {
        if (state.computed) copy += state.computed + "\t";
      });
    }

    if (this.APP[MethodGetState]().column.active) {
      const column = this.APP[MethodGetState]().column.column as number;

      data.forEach((row) => {
        const state = row[column];

        if (state.computed) copy += state.computed + "\n";
      });
    }

    if (this.APP[MethodGetState]().all) {
      for (let row = 0; row < data.length; row++) {
        for (let column = 0; column < data[row].length; column++) {
          const state = data[row][column];
          if (state.computed) copy += state.computed + "\t";
        }
        copy = copy.trim() + "\n";
      }
    }

    await navigator.clipboard.writeText(copy.trim());

    copy = "";
  };

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

  public selectAllCell() {
    this.APP[MethodGetState]().all = true;

    this.APP[MethodGetControllers]().schema.elements.tableHead.classList.add(
      "all-select"
    );

    this.APP[MethodGetControllers]().schema.elements.tableBody.classList.add(
      "all-select"
    );
  }

  public unselectAllCell() {
    this.APP[MethodGetState]().all = false;

    this.APP[MethodGetControllers]().schema.elements.tableHead.classList.remove(
      "all-select"
    );

    this.APP[MethodGetControllers]().schema.elements.tableBody.classList.remove(
      "all-select"
    );
  }

  public selectAllCellByColumn(cell: string | HTMLElement) {
    let location: string = "";

    if (typeof cell === "string") {
      location = cell;
      cell = this.APP[
        MethodGetControllers
      ]().schema.elements.tableBody.querySelector(
        `th[data-char="${cell}"]`
      ) as HTMLElement;
    }

    if (!location) location = cell.dataset.char as string;

    if (
      this.APP[MethodGetState]().column.active &&
      this.APP[MethodGetState]().column.location !== location
    )
      this.unselectAllCellByColumn();

    const { char, column } = cell.dataset as any;

    cell.classList.add("location-select");

    document.styleSheets[0].insertRule(`tbody tr td.cell:nth-child(${
      Number(column) + 2
    }) {
    --tw-bg-opacity: 1;
    background-color: rgb(191 219 254 / var(--tw-bg-opacity)) !important;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    }`);

    this.APP[MethodGetControllers]().schema.elements.tableBody.classList.add(
      "column-select"
    );

    this.APP[MethodGetState]().column.active = true;
    this.APP[MethodGetState]().column.location = location;
    this.APP[MethodGetState]().column.column = char;
  }

  public unselectAllCellByColumn() {
    const element = this.APP[
      MethodGetControllers
    ]().schema.elements.tableHead.querySelector(
      `[data-type="cell-char"][data-char="${
        this.APP[MethodGetState]().column.location
      }"]`
    ) as HTMLElement;

    this.APP[MethodGetState]().column.active = false;
    this.APP[MethodGetState]().column.location = "";
    this.APP[MethodGetState]().column.column = "";

    this.APP[MethodGetControllers]().schema.elements.tableBody.classList.remove(
      "column-select"
    );

    document.styleSheets[0].deleteRule(0);

    element.classList.remove("location-select");
  }

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

    if (
      this.APP[MethodGetState]().row.active &&
      this.APP[MethodGetState]().row.location !== location
    )
      this.unselectAllCellByRow();

    const { id } = cell.dataset as any;

    cell.classList.add("location-select");

    document.styleSheets[0].insertRule(`tbody tr:nth-child(${
      Number(id) + 1
    }) td.cell {
    --tw-bg-opacity: 1;
    background-color: rgb(191 219 254 / var(--tw-bg-opacity)) !important;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    }`);

    this.APP[MethodGetControllers]().schema.elements.tableHead.classList.add(
      "row-select"
    );

    this.APP[MethodGetState]().row.active = true;
    this.APP[MethodGetState]().row.location = location;
    this.APP[MethodGetState]().row.row = id;
  }

  public unselectAllCellByRow() {
    const element = this.APP[
      MethodGetControllers
    ]().schema.elements.tableBody.querySelector(
      `[data-type="cell-number"][data-number="${
        this.APP[MethodGetState]().row.location
      }"]`
    ) as HTMLElement;

    this.APP[MethodGetState]().row.active = false;
    this.APP[MethodGetState]().row.location = "";
    this.APP[MethodGetState]().row.row = "";

    this.APP[MethodGetControllers]().schema.elements.tableHead.classList.remove(
      "row-select"
    );

    document.styleSheets[0].deleteRule(0);

    element.classList.remove("location-select");
  }

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

  public handlerClick_cellBase() {
    if (this.APP[MethodGetState]().column.active)
      this.unselectAllCellByColumn();

    if (this.APP[MethodGetState]().row.active) this.unselectAllCellByRow();

    if (this.APP[MethodGetState]().cell.active) this.unselectCell();

    this.selectAllCell();
  }

  public handlerClick_cellChar(cell: HTMLElement) {
    if (this.APP[MethodGetState]().all) this.unselectAllCell();

    if (this.APP[MethodGetState]().row.active) this.unselectAllCellByRow();

    if (this.APP[MethodGetState]().cell.active) this.unselectCell();

    if (this.APP[MethodGetState]().column.location !== cell.dataset.char)
      this.selectAllCellByColumn(cell);
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

    if (mainCell && mainCell.dataset.type === "cell-base")
      this.handlerClick_cellBase();

    if (mainCell && mainCell.dataset.type === "cell-char")
      this.handlerClick_cellChar(mainCell);

    if (mainCell && mainCell.dataset.type === "cell-number")
      this.handlerClick_cellNumber(mainCell);

    if (cell && cell.dataset.type === "cell")
      this.handlerClick_cell(cell, event);
  };
}
