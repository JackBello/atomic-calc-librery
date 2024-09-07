import { ulid } from "ulid";
import { AtomicCalc } from "./calc";
import { MethodGetData, MethodGetOptions } from "../symbols";
import { numberToChar, range } from "../utils";

export class SchemaCalc {
  protected APP: AtomicCalc;

  protected container!: HTMLElement;

  protected table!: HTMLElement;
  protected tableHead!: HTMLElement;
  protected tableBody!: HTMLElement;
  protected tableFooter!: HTMLElement;

  protected SHOW = {
    head: true,
    footer: false,
  };

  get elements() {
    return {
      container: this.container,
      table: this.table,
      tableHead: this.tableHead,
      tableBody: this.tableBody,
      tableFooter: this.tableFooter,
    };
  }

  constructor(app: AtomicCalc) {
    this.APP = app;
  }

  public createElements(selector: string | HTMLElement) {
    let reference: HTMLElement | null;

    if (typeof selector === "string") {
      reference = document.querySelector(selector);
    } else {
      reference = selector;
    }

    if (reference === null)
      throw new Error("element '" + selector + "' no found");

    this.makeContainer();
    this.makeTable();

    if (this.SHOW.head) this.makeTableHead();

    this.makeTableBody();

    if (this.SHOW.footer) this.makeTableFooter();

    this.init();

    reference.append(this.container);
  }

  protected makeContainer() {
    this.container = document.createElement("section");

    this.container.dataset.id = ulid();
    this.container.dataset.version = "1.0.0";
    this.container.dataset.type = "table-container";
    this.container.dataset.rows = this.APP.rows.toString();
    this.container.dataset.columns = this.APP.columns.toString();
    this.container.dataset.cells = this.APP.cells.toString();
    this.container.dataset.state = "default";

    this.container.classList.add("table-container");

    this.container.style.maxWidth = `${this.APP[MethodGetOptions]().width}px`;
    this.container.style.maxHeight = `${this.APP[MethodGetOptions]().height}px`;
  }

  protected makeTable() {
    this.table = document.createElement("table");
    this.table.dataset.type = "table";

    this.table.style.background = `${
      this.APP[MethodGetOptions]().style.background
    }`;
  }

  protected makeTableHead() {
    this.tableHead = document.createElement("thead");
    this.tableHead.dataset.type = "table-head";

    if (this.APP[MethodGetOptions]().style.fixedHead)
      this.tableHead.classList.add("fixed-row");
  }

  protected makeTableBody() {
    this.tableBody = document.createElement("tbody");
    this.tableBody.dataset.type = "table-body";
  }

  protected makeTableFooter() {
    this.tableBody = document.createElement("tbody");
    this.tableBody.dataset.type = "table-body";
  }

  protected insertRowChar() {
    if (!this.SHOW.head) return;

    const rowChar = document.createElement("tr");

    rowChar.dataset.type = "row-base";

    const borderStyle = `${
      this.APP[MethodGetOptions]().style.spacing
    }px solid ${this.APP[MethodGetOptions]().style.background}`;

    const baseCell = document.createElement("th");

    baseCell.dataset.type = "cell-base";
    baseCell.dataset.cell = "*";

    baseCell.classList.add("cell-main", "cell-base");

    baseCell.style.width = `${this.APP.size.columns}px`;
    baseCell.style.background = `${
      this.APP[MethodGetOptions]().style.backgroundCellControl
    }`;

    baseCell.style.borderRight = borderStyle;
    baseCell.style.borderLeft = borderStyle;
    baseCell.style.borderTop = borderStyle;
    baseCell.style.borderBottom = borderStyle;

    rowChar.append(baseCell);

    range(this.APP.columns).forEach((column) => {
      const cellChar = document.createElement("th");

      const char = numberToChar(column);

      cellChar.dataset.type = "cell-char";
      cellChar.dataset.char = char;
      cellChar.dataset.column = column.toString();
      cellChar.innerHTML = `<section><span>${char}</span></section>`;

      cellChar.style.width = `${this.APP.size.columns}px`;
      cellChar.style.background = `${
        this.APP[MethodGetOptions]().style.backgroundCellControl
      }`;

      cellChar.style.borderTop = borderStyle;
      cellChar.style.borderBottom = borderStyle;
      cellChar.style.borderRight = borderStyle;

      cellChar.classList.add("cell-basic", "cell-main", "cell-char");

      rowChar.append(cellChar);
    });

    rowChar.style.height = `${this.APP.size.rows}px`;

    this.tableHead.append(rowChar);
  }

  protected insertColumnNumber() {
    range(this.APP.rows).forEach((row) => {
      const number = row + 1;

      const rowCell = document.createElement("tr");

      rowCell.dataset.type = "row-cell";
      rowCell.dataset.number = number.toString();
      rowCell.dataset.row = row.toString();

      const cellNumber = document.createElement("th");

      cellNumber.dataset.type = "cell-number";
      cellNumber.dataset.number = number.toString();
      cellNumber.dataset.id = row.toString();

      cellNumber.innerHTML = `<section><span>${number}</span></section>`;

      cellNumber.style.background = `${
        this.APP[MethodGetOptions]().style.backgroundCellControl
      }`;

      cellNumber.style.borderRight = `${
        this.APP[MethodGetOptions]().style.spacing
      }px solid ${this.APP[MethodGetOptions]().style.background}`;

      cellNumber.classList.add("cell-basic", "cell-main", "cell-number");

      if (this.APP[MethodGetOptions]().style.fixedColumnNumber)
        cellNumber.classList.add("fixed-columns");

      rowCell.style.height = `${this.APP.size.rows}px`;

      rowCell.append(cellNumber);

      this.tableBody.append(rowCell);
    });
  }

  protected insertCells() {
    const rows = this.tableBody.querySelectorAll(`[data-type="row-cell"]`);

    rows.forEach((rowCell, row) => {
      range(this.APP.columns).forEach((column) => {
        const cell = document.createElement("td");

        const char = numberToChar(column);
        const number = row + 1;

        cell.dataset.type = "cell";
        cell.dataset.column = column.toString();
        cell.dataset.row = row.toString();
        cell.dataset.location = `${char}${number}`;
        cell.dataset.idChar = char;
        cell.dataset.idNumber = number.toString();

        cell.style.background = `${
          this.APP[MethodGetOptions]().style.backgroundCell
        }`;

        cell.classList.add("cell-basic", "cell");

        cell.innerHTML = `
          <section>
            <span>${this.APP[MethodGetData]()[row][column].computed}</span>
            <input type="text" value="${
              this.APP[MethodGetData]()[row][column].value
            }"/>
          </section>
        `;

        rowCell.append(cell);
      });
    });
  }

  protected init() {
    if (this.SHOW.head) {
      this.table.append(this.tableHead);

      this.insertRowChar();
    }

    this.table.append(this.tableBody);

    this.insertColumnNumber();
    this.insertCells();

    if (this.SHOW.footer) this.table.append(this.tableFooter);

    this.container.append(this.table);
  }
}
