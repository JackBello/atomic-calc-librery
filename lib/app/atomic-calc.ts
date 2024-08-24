import { ulid } from "ulid";

export class AtomicCalc {
  private element: HTMLElement;

  private options = {
    rows: 0,
    columns: 0,
  } as {
    rows: number;
    columns: number;
  };

  private state: Array<
    Array<{
      value: any;
      computed: string;
      cellVar: string;
      x: number;
      y: number;
      config?: {
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
      };
    }>
  > = [[]];

  private selection = {
    cell: "",
    column: "",
    row: "",
  };

  private stateElement = {
    select: false,
    select_column: false,
    select_row: false,
    formula: false,
  };

  private functions = {
    SUM: (...numbers: number[]) => {
      let result = 0;

      numbers.forEach((number) => {
        result += number;
      });

      return result;
    },
    RES: (...numbers: number[]) => {
      let result = 0;

      numbers.forEach((number) => {
        result -= number;
      });

      return result;
    },
    MUL: (...numbers: number[]) => {
      let result = 0;

      numbers.forEach((number) => {
        result *= number;
      });

      return result;
    },
    DIV: (...numbers: number[]) => {
      let result = 0;

      numbers.forEach((number) => {
        result /= number;
      });

      return result;
    },
    MOD: (...numbers: number[]) => {
      let result = 0;

      numbers.forEach((number) => {
        result /= number;
      });

      return result;
    },
  };

  private relationships = new Map<
    string,
    {
      plain: string;
      input_ref: string[];
      output_ref: {
        cell: string;
        x: number;
        y: number;
      };
      hash: string;
    }
  >();

  constructor(
    selector: string | HTMLElement,
    rows: number = 10,
    columns: number = 10
  ) {
    if (typeof selector === "string") {
      this.element = document.querySelector(selector) as HTMLElement;
    } else {
      this.element = selector;
    }

    this.options = {
      rows,
      columns,
    };
  }

  start() {
    this.initState();
    this.createElements();
    this.insertElements();
    this.initEvents();
  }

  protected list(length: number) {
    return [...Array(length).keys()];
  }

  protected initState() {
    this.state = this.list(this.options.rows).map((row) =>
      this.list(this.options.columns).map((column) => ({
        value: "",
        computed: "",
        cellVar: `${this.numberToChar(column)}${row + 1}`,
        x: column,
        y: row,
      }))
    );
  }

  protected createElements() {
    const container = document.createElement("section");

    container.dataset.atomicCalcVersion = "1.0.0";
    container.dataset.type = "table";
    container.dataset.rows = this.options.rows.toString();
    container.dataset.columns = this.options.columns.toString();
    container.dataset.cells = `${this.options.rows * this.options.columns}`;

    const sectionHead = document.createElement("section");

    sectionHead.dataset.type = "table-head";

    sectionHead.style.gridTemplateColumns = `repeat(${
      this.options.columns + 1
    }, 1fr)`;

    const baseCell = document.createElement("section");

    baseCell.dataset.type = "cell-base";
    baseCell.dataset.location = "head-cell";

    sectionHead.appendChild(baseCell);

    const sectionBody = document.createElement("section");

    sectionBody.dataset.type = "table-body";

    sectionBody.style.gridTemplateColumns = `repeat(${
      this.options.columns + 1
    }, 1fr)`;
    sectionBody.style.gridTemplateRows = `repeat(${this.options.rows}, 30px)`;

    container.appendChild(sectionHead);
    container.appendChild(sectionBody);

    this.element.appendChild(container);
  }

  protected numberToChar(number: number) {
    let columnName = "";

    while (number >= 0) {
      columnName = String.fromCharCode((number % 26) + 65) + columnName;
      number = Math.floor(number / 26) - 1;
    }

    return columnName;
  }

  protected insertElements() {
    const sectionHead = this.element.querySelector('[data-type="table-head"]');
    const sectionBody = this.element.querySelector('[data-type="table-body"]');

    this.list(this.options.rows).forEach((row) => {
      const cellNumber = document.createElement("section");

      cellNumber.dataset.type = "cell-number";
      cellNumber.dataset.location = "body-cell";
      cellNumber.dataset.number = (row + 1).toString();
      cellNumber.dataset.row = row.toString();
      cellNumber.innerHTML = `<span>${row + 1}</span>`;
      cellNumber.style.gridColumn = "1";

      sectionBody?.appendChild(cellNumber);
    });

    this.list(this.options.columns).forEach((column) => {
      const cellChar = document.createElement("section");

      const char = this.numberToChar(column);

      cellChar.dataset.type = "cell-char";
      cellChar.dataset.location = "head-cell";
      cellChar.dataset.char = char;
      cellChar.dataset.column = column.toString();
      cellChar.innerHTML = `<span>${char}</span>`;

      sectionHead?.appendChild(cellChar);

      this.list(this.options.rows).forEach((row) => {
        const cell = document.createElement("section");

        cell.dataset.type = "cell";
        cell.dataset.location = "body-cell";
        cell.dataset.x = column.toString();
        cell.dataset.y = row.toString();
        cell.dataset.var = `${char}${row + 1}`;
        cell.style.gridColumn = `${column + 2}`;
        cell.style.gridRow = `${row + 1}`;

        cell.innerHTML = `
        <span>${this.state[row][column].computed}</span>
        <input type="text" value="${this.state[row][column].value}"/>
        `;

        sectionBody?.appendChild(cell);
      });
    });
  }

  protected computedMath(vars: string[]) {
    const container = this.element.querySelector('[data-type="table"]');

    return vars.map((cellVar) => {
      const { x, y } = (
        container?.querySelector(`[data-var="${cellVar}"]`) as any
      ).dataset;

      const process = this.processMatch(this.state[y][x].value, cellVar);

      return {
        value: process === undefined ? 0 : process,
        var: cellVar,
      };
    });
  }

  protected computedRange(vars: string[]) {
    return this.makeRange(vars).map(({ x, y, cell }) => {
      return this.processMatch(this.state[y][x].value, cell);
    });
  }

  protected makeRange(vars: string[]) {
    const result: Array<{
      x: number;
      y: number;
      cell: string;
    }> = [];

    const startsChar = vars[0].replace(/\d+/g, "");
    const finishChar = vars[1].replace(/\d+/g, "");

    const startsNumber = Number(vars[0].replace(/[A-Z]/g, ""));
    const finishNumber = Number(vars[1].replace(/[A-Z]/g, ""));

    if (startsChar === finishChar) {
      const cellColumn = (
        this.element.querySelector(`[data-var="${vars[0]}"]`) as HTMLElement
      ).dataset.x as any;

      for (let row = startsNumber - 1; row < finishNumber; row++) {
        const cell = this.state[row][cellColumn];

        result.push({
          cell: cell.cellVar,
          x: cell.x,
          y: cell.y,
        });
      }
    }

    if (startsChar !== finishChar && startsNumber === finishNumber) {
      const cellRow = Number(
        (this.element.querySelector(`[data-var="${vars[0]}"]`) as HTMLElement)
          .dataset.y
      );

      const toColumn = Number(
        (this.element.querySelector(`[data-var="${vars[1]}"]`) as HTMLElement)
          .dataset.x
      );

      for (let column = startsNumber - 1; column < toColumn + 1; column++) {
        const cell = this.state[cellRow][column];

        result.push({
          cell: cell.cellVar,
          x: cell.x,
          y: cell.y,
        });
      }
    }

    if (startsChar !== finishChar && startsNumber !== finishNumber) {
    }

    return result;
  }

  protected deleteRelation(position: string) {
    const element = this.element.querySelector(
      `[data-var="${position}"]`
    ) as HTMLElement;

    if (!element.dataset.hash) return;

    this.relationships.delete(element.dataset.hash);

    element.removeAttribute("data-hash");
  }

  protected updateRelation(hash: string, plain: string) {
    const relation = this.relationships.get(hash);

    if (!relation) return;

    if (relation.plain === plain) return;

    if (plain === "") {
      this.deleteRelation(relation.output_ref.cell);

      return;
    }

    relation.plain = plain;
    relation.input_ref = plain.split("_");

    this.relationships.set(relation.hash, relation);
  }

  protected makeRelation(position: string, vars: string[]) {
    const element = this.element.querySelector(
      `[data-var="${position}"]`
    ) as HTMLElement;

    if (element.dataset.hash) {
      this.updateRelation(element.dataset.hash, vars.join("_"));

      return;
    }

    if (vars.length === 0) return;

    const { x, y } = element.dataset as any;

    const hash = ulid();

    element.dataset.hash = hash;

    this.relationships.set(hash, {
      plain: vars.join("_"),
      input_ref: vars,
      output_ref: {
        cell: position,
        x: Number(x),
        y: Number(y),
      },
      hash,
    });
  }

  protected processRelation(position: string) {
    const relationships = [...this.relationships.values()].filter(
      ({ input_ref }) => input_ref.includes(position)
    );

    relationships.forEach(({ output_ref }) => {
      const { x, y, cell } = output_ref;

      const element = this.element.querySelector(
        `[data-var="${cell}"]`
      ) as HTMLElement;
      const span = element.querySelector("span") as HTMLElement;

      const cellState = this.state[y][x];

      cellState.computed = this.processMatch(
        cellState.value,
        cellState.cellVar
      );

      this.state[y][x] = cellState;

      span.innerText = cellState.computed;
    });
  }

  protected processMatch(value: string, position: string) {
    if (value === "") return 0;

    const data = value.startsWith("=") ? value.slice(1) : value;

    const vars = data.match(/[A-Za-z]+\d+/g) ?? [];

    let result = "";
    let computed: any[] = [];

    if (/[A-Z]+\d+:[A-Z]+\d+/g.test(data)) {
      this.makeRelation(
        position,
        this.makeRange(vars).map(({ cell }) => cell)
      );
      computed = this.computedRange(vars);

      result = data.replace(/[A-Z]+\d+:[A-Z]+\d+/g, `${computed.join(",")}`);

      computed = [];
    } else {
      this.makeRelation(position, vars);
      computed = this.computedMath([...new Set(vars).values()]);
      result = data;
    }

    const code = `
        const window = undefined;
        const document = undefined;
        const alert = undefined;
        const fetch = undefined;
        const localStorage = undefined;
        const sessionStorage = undefined;
        const XMLHttpRequest = undefined;
        const WebSocket = undefined;
        const Function = undefined;
        const console = undefined;
        const confirm = undefined
        const eval = undefined
        const prompt = undefined

        ${computed
          .map((object: any) => `const ${object.var} = ${object.value};`)
          .join("\n")}

        return ${result}
    `;

    const execute = new Function("{ SUM }", code);

    let output;

    try {
      output = execute(this.functions);
    } catch (error) {
      console.log(error);

      output = "!ERROR";
    }

    return output;
  }

  protected processValue(value: any, position: string) {
    this.processRelation(position);

    if (value === "") {
      this.deleteRelation(position);

      return value;
    }

    if (typeof value === "string" && value.startsWith("="))
      return this.processMatch(value, position);
    if (typeof value === "string" && !value.startsWith("=")) return value;

    return value;
  }

  protected processInput = (value: any, cellElement: HTMLElement) => {
    const { x, y } = cellElement.dataset as any;
    const position = cellElement.dataset.var as any;
    const span = cellElement.querySelector("span") as HTMLElement;

    const cell = this.state[y][x];

    if (value === cell.value) return;

    cell.value = value;
    cell.computed = this.processValue(value, position);

    this.state[y][x] = cell;

    span.innerText = cell.computed;
  };

  protected selectColumnAndRow = (cellVar: string, action: string) => {
    const char = cellVar.replace(/\d+/g, "");
    const number = cellVar.replace(/[A-Z]/g, "");

    const column = this.element.querySelector(
      `[data-char="${char}"]`
    ) as HTMLElement;
    const row = this.element.querySelector(
      `[data-number="${number}"]`
    ) as HTMLElement;

    if (action === "add") {
      row.classList.add("location-select");
      column.classList.add("location-select");
    }

    if (action === "remove") {
      row.classList.remove("location-select");
      column.classList.remove("location-select");
    }
  };

  protected handlerClick_cell = (element: HTMLElement) => {
    const input = element.querySelector("input");
    const cellVar = element.dataset.var as any;

    this.selectColumnAndRow(cellVar, "add");

    input?.classList.add("cell-focus");

    input?.focus();

    input?.setSelectionRange(input.value.length, input.value.length);

    input?.addEventListener(
      "blur",
      () => {
        this.selectColumnAndRow(cellVar, "remove");

        this.stateElement.select = false;

        input?.classList.remove("cell-focus");

        this.processInput(input?.value, element);
      },
      { once: true }
    );
  };

  protected removeSelectColumn() {}

  protected handlerClick_allCellByColumn(element: HTMLElement) {
    const column = element.dataset.column as any;

    element.classList.add("location-select");

    this.state.forEach((columns) => {
      const state = columns[column];
      const cell = this.element.querySelector(
        `[data-var="${state.cellVar}"]`
      ) as HTMLElement;

      cell.classList.add("cell-select");
    });

    let result = "";

    document.addEventListener("copy", () => {
      this.state.forEach((columns) => {
        const state = columns[column];

        result += state.computed + "\n";
      });
    });
  }

  protected initEvents() {
    const container = this.element.querySelector('[data-type="table"]');

    container?.addEventListener("click", (event) => {
      const cell = (event.target as HTMLElement).closest("section");

      if (!cell) return;

      if (cell.dataset.type === "cell-char") {
        this.stateElement.select_column = true;
        this.handlerClick_allCellByColumn(cell);
      }

      if (cell.dataset.type === "cell" && !this.stateElement.select) {
        this.stateElement.select = true;
        this.handlerClick_cell(cell);
      }
    });
  }
}
