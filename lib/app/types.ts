export type TFunction = (...args: any[]) => void | Promise<void>;

export type TComputedFormula = {
  column: number | string;
  row: number | string;
  location: string;
  value: any;
};

export type TStatusCalc = {
  open: string;
  type: "empty" | "book" | "sheet";
};

export type TRelationsCell = {
  inline: string;
  relations: string[];
  output: {
    location: string;
    column: number | string;
    row: number | string;
  };
  formulas: string[];
  id: string;
};

export type TDataSheet = {
  value: any;
  computed: string;
  location: string;
  id: string;
  column: number | string;
  row: number | string;
  options?: {
    type_input:
      | "text"
      | "number"
      | "file"
      | "range"
      | "checkbox"
      | "radio"
      | "button";
    format_computed:
      | "default"
      | "number"
      | "decimal"
      | "money"
      | "size"
      | "weight";
    horizontal_align: "left" | "center" | "right";
    vertical_align: "top" | "middle" | "bottom";
    background_cell: string;
  };
};

export type TSettingsAtomicCalc = {
  rows: {
    quantity: number;
    size: number;
  };
  columns: {
    quantity: number;
    size: number;
  };
  style: {
    background: string;
    backgroundCell: string;
    backgroundCellControl: string;
    fixedHead: boolean;
    fixedColumnNumber: boolean;
    spacing: number;
  };
  width: number;
  height: number;
};

export type TActive = {
  active: boolean;
  location: string;
  column: number | string;
  row: number | string;
};

export type TState = {
  cell: TActive;
  column: Omit<TActive, "column" | "row">;
  row: Omit<TActive, "column" | "row">;
  focus: TActive;
  formula: boolean;
  all: boolean;
};
