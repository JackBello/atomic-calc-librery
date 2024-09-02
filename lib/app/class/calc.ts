import { ulid } from "ulid";
import {
  MethodGetControllers,
  MethodGetData,
  MethodGetOptions,
  MethodGetState,
} from "../symbols";
import { TDataSheet, TSettingsAtomicCalc, TState, TStatusCalc } from "../types";
import { numberToChar, range } from "../utils";
import { SchemaCalc } from "./schema";
import { RelationsCalc } from "./relations";
import { FormulaCell } from "./formula";
import { HandlerCalc } from "./handler";
import { CalcBookSheet } from "./book";
import { CalcSheet } from "./sheet";

export class AtomicCalc {
  protected PLUGINS: Map<string, any> = new Map();

  protected BOOKS: Map<string, CalcBookSheet>;

  protected SHEETS: Map<string, CalcSheet>;

  protected OPTIONS: TSettingsAtomicCalc = {
    columns: {
      quantity: 10,
      size: 100,
    },
    rows: {
      quantity: 10,
      size: 30,
    },
    height: 600,
    width: 1000,
    style: {
      background: "#cbd5e1",
      backgroundCell: "#ffffff",
      backgroundCellControl: "#f1f5f9",
      fixedColumnNumber: true,
      fixedHead: true,
      spacing: 1,
    },
  };

  protected DATA: TDataSheet[][] = [[]];

  protected STATUS: TStatusCalc = {
    open: "",
    type: "empty",
  };

  protected STATE: TState = {
    cell: {
      active: false,
      location: "",
      column: "",
      row: "",
    },
    column: {
      active: false,
      location: "",
    },
    row: {
      active: false,
      location: "",
    },
    focus: {
      active: false,
      location: "",
      column: "",
      row: "",
    },
    formula: false,
    all: false,
  };

  protected _SCHEMA: SchemaCalc;
  protected _RELATIONS: RelationsCalc;
  protected _FORMULA: FormulaCell;
  protected _HANDLER: HandlerCalc;

  get columns() {
    return this.OPTIONS.columns.quantity;
  }

  get rows() {
    return this.OPTIONS.rows.quantity;
  }

  get cells() {
    return this.OPTIONS.columns.quantity * this.OPTIONS.rows.quantity;
  }

  get size() {
    return {
      columns: this.OPTIONS.columns.size,
      rows: this.OPTIONS.rows.size,
    };
  }

  constructor(
    selector: string | HTMLElement,
    rows: number = 10,
    columns: number = 10
  ) {
    this.OPTIONS.rows.quantity = rows;
    this.OPTIONS.columns.quantity = columns;

    this.DATA = range(this.rows).map((row) =>
      range(this.columns).map((column) => ({
        value: "",
        computed: "",
        location: `${numberToChar(column)}${row + 1}`,
        column,
        row,
        id: ulid(),
      }))
    );

    this.BOOKS = new Map();
    this.SHEETS = new Map();

    this._SCHEMA = new SchemaCalc(this);
    this._SCHEMA.createElements(selector);

    this._RELATIONS = new RelationsCalc(this);
    this._FORMULA = new FormulaCell(this);
    this._HANDLER = new HandlerCalc(this);
  }

  [MethodGetOptions]() {
    return this.OPTIONS;
  }

  [MethodGetState]() {
    return this.STATE;
  }

  [MethodGetData]() {
    return this.DATA;
  }

  [MethodGetControllers]() {
    return {
      schema: this._SCHEMA,
      formula: this._FORMULA,
    };
  }
}
