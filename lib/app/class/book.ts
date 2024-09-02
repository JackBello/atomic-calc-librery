import { ulid } from "ulid";
import { AtomicCalc } from "./calc";
import { CalcSheet } from "./sheet";
import { MethodSetApp } from "../symbols";

export class CalcBookSheet {
  public name: string;

  protected APP!: AtomicCalc;
  protected SHEETS: Map<string, CalcSheet>;
  protected ID: string;

  constructor(name: string, sheets: CalcSheet[] | CalcSheet) {
    this.name = name;
    this.SHEETS = new Map();

    if (Array.isArray(sheets))
      sheets.forEach((sheet) => {
        this.SHEETS.set(sheet.name, sheet);
      });
    else this.SHEETS.set(sheets.name, sheets);

    this.ID = ulid();
  }

  add(sheet: CalcSheet) {
    this.SHEETS.set(sheet.name, sheet);
  }

  delete(sheet: string) {
    this.SHEETS.delete(sheet);
  }

  import() {}

  export() {}

  [MethodSetApp](app: AtomicCalc) {
    this.APP = app;
  }
}
