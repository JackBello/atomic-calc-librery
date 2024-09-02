import { ulid } from "ulid";
import { TDataSheet } from "../types";
import { AtomicCalc } from "./calc";
import { MethodSetApp } from "../symbols";

export class CalcSheet {
  public name: string;

  protected APP!: AtomicCalc;
  protected DATA: Map<string, TDataSheet>;
  protected ID: string;

  constructor(name: string) {
    this.name = name;

    this.DATA = new Map();
    this.ID = ulid();
  }

  findCell() {}

  findCellById() {}

  findCellByLocation() {}

  getCells() {}

  getCellsByColumn() {}

  getCellsByRow() {}

  updateCell() {}

  updateRow() {}

  updateColumn() {}

  deleteCell() {}

  deleteRow() {}

  deleteColumn() {}

  import() {}

  export() {}

  [MethodSetApp](app: AtomicCalc) {
    this.APP = app;
  }
}
