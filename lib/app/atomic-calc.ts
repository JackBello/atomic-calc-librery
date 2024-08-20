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
    }>
  > = [[]];

  private functions = {
    SUM: (...numbers: number[]) => {
      let result = 0;

      numbers.forEach((number) => {
        result += number;
      });

      return result;
    },
  };

  private computedState: Record<string, string[]> = {};

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

  protected range(length: number) {
    return [...Array(length).keys()];
  }

  protected initState() {
    this.state = this.range(this.options.rows).map(() =>
      this.range(this.options.columns).map(() => ({
        value: "",
        computed: "",
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
    const firstCharCode = 65;
    const lastCharCode = 90;

    return String.fromCharCode(firstCharCode + number);
  }

  protected insertElements() {
    const sectionHead = this.element.querySelector('[data-type="table-head"]');
    const sectionBody = this.element.querySelector('[data-type="table-body"]');

    this.range(this.options.rows).forEach((row) => {
      const cellNumber = document.createElement("section");

      cellNumber.dataset.type = "cell-number";
      cellNumber.dataset.location = "body-cell";
      cellNumber.dataset.number = (row + 1).toString();
      cellNumber.innerHTML = `<span>${row + 1}</span>`;
      cellNumber.style.gridColumn = "1";

      sectionBody?.appendChild(cellNumber);
    });

    this.range(this.options.columns).forEach((column) => {
      const cellChar = document.createElement("section");

      cellChar.dataset.type = "cell-char";
      cellChar.dataset.location = "head-cell";
      cellChar.dataset.char = this.numberToChar(column);
      cellChar.innerHTML = `<span>${this.numberToChar(column)}</span>`;

      sectionHead?.appendChild(cellChar);

      this.range(this.options.rows).forEach((row) => {
        const cell = document.createElement("section");

        cell.dataset.type = "cell";
        cell.dataset.location = "body-cell";
        cell.dataset.x = column.toString();
        cell.dataset.y = row.toString();
        cell.dataset.var = `${this.numberToChar(column)}${row + 1}`;
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

  protected existRelation(position: string) {
    const relations = Object.keys(this.computedState);

    return relations.find((key) => key.includes(position)) !== undefined;
  }

  protected deleteRelation(position: string) {
    const relations = Object.entries(this.computedState).filter((arr) =>
      arr[1].includes(position)
    );

    relations.forEach(([key, map]) => {
      const filter = map.filter((value) => value !== position);

      if (filter.length === 0) delete this.computedState[key];
      else this.computedState[key] = filter;
    });
  }

  protected processRelationships(position: string) {
    const container = this.element.querySelector('[data-type="table"]');

    const relations = Object.entries(this.computedState)
      .filter(([key]) => key.includes(position))
      .map((arr) => arr[1]);

    console.log(relations);

    relations.forEach((list) => {
      list.forEach((relation) => {
        const cellElement = container?.querySelector(
          `[data-var="${relation}"]`
        ) as any;
        const span = cellElement.querySelector("span");

        const { x, y } = cellElement.dataset;

        const cell = this.state[x][y];

        cell.computed = this.processMatch(cell.value, position);

        this.state[x][y] = cell;

        if (span) {
          span.innerText = cell.computed;
        }
      });
    });
  }

  protected computedMath(vars: string[]) {
    const container = this.element.querySelector('[data-type="table"]');

    return vars.map((cellVar) => {
      const { x, y } = (
        container?.querySelector(`[data-var="${cellVar}"]`) as any
      ).dataset;

      const childPosition = (
        container?.querySelector(`[data-var="${cellVar}"]`) as any
      ).dataset.var;

      const process = this.processMatch(this.state[x][y].value, childPosition);

      return {
        value: process === undefined ? 0 : process,
        var: cellVar,
      };
    });
  }

  protected rowToRow(vars: string[], endRow: number, startChar: string) {
    const container = this.element.querySelector('[data-type="table"]');

    const result: any[] = [];

    const startColumn = (
      container?.querySelector(`[data-var="${vars[0]}"]`) as any
    ).dataset.x;

    for (let row = 0; row < endRow; row++) {
      result.push(
        this.processMatch(
          this.state[startColumn][row].value,
          `${startChar}${row + 1}`
        )
      );
    }

    return result;
  }

  protected columnToColumn(vars: string[]) {
    const container = this.element.querySelector('[data-type="table"]');

    const result: any[] = [];

    const startRow = (
      container?.querySelector(`[data-var="${vars[0]}"]`) as any
    ).dataset.y;

    const endColumn = Number(
      (container?.querySelector(`[data-var="${vars[1]}"]`) as any).dataset.x
    );

    for (let column = 0; column < endColumn + 1; column++) {
      result.push(
        this.processMatch(
          this.state[column][startRow].value,
          this.numberToChar(column) + (Number(startRow) + 1)
        )
      );
    }

    return result;
  }

  protected computedRange(vars: string[]) {
    const startChar = vars[0].replace(/\d+/g, "");
    const endChar = vars[1].replace(/\d+/g, "");

    const startNumber = Number(vars[0].replace(/[A-Z]/g, ""));
    const endNumber = Number(vars[1].replace(/[A-Z]/g, ""));

    let result: any[] = [];

    if (startChar === endChar) {
      result = this.rowToRow(vars, endNumber, startChar);
    } else if (startChar !== endChar) {
      result = this.columnToColumn(vars);
    }

    return result;
  }

  protected processMatch(value: string, position: string) {
    if (value === "") return 0;

    const data = value.startsWith("=") ? value.slice(1) : value;

    const vars = data.match(/[A-Za-z]+\d+/g) ?? [];

    const relation = this.computedState[vars.join("_")];

    if (relation && !relation.includes(position)) {
      relation.push(position);
    } else {
      this.computedState[vars.join("_")] = [position];
    }

    let result = "";
    let computed: any[] = [];

    if (/[A-Z]+\d+:[A-Z]+\d+/g.test(data)) {
      computed = this.computedRange(vars);

      result = data.replace(/[A-Z]+\d+:[A-Z]+\d+/g, `${computed.join(",")}`);

      computed = [];
    } else {
      computed = this.computedMath([...new Set(vars)]);
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
      output = "!ERROR";
    }

    return output;
  }

  protected processValue(value: any, position: string) {
    if (value === "") {
      this.deleteRelation(position);

      return value;
    }

    if (this.existRelation(position)) this.processRelationships(position);

    if (typeof value === "string" && value.startsWith("="))
      return this.processMatch(value, position);
    if (typeof value === "string" && !value.startsWith("=")) return value;

    return value;
  }

  protected processInput = (value: any, cellElement: HTMLElement) => {
    const { x, y } = cellElement.dataset as any;
    const position = cellElement.dataset.var as any;
    const span = cellElement.querySelector("span");

    const cell = this.state[x][y];

    if (value === cell.value) return;

    cell.value = value;
    cell.computed = this.processValue(value, position);

    this.state[x][y] = cell;

    if (span) {
      span.innerText = cell.computed;
    }
  };

  protected handlerClick_cell = (element: HTMLElement) => {
    const input = element.querySelector("input");

    input?.focus();

    input?.setSelectionRange(input.value.length, input.value.length);

    input?.addEventListener(
      "blur",
      () => {
        this.processInput(input?.value, element);
      },
      { once: true }
    );
  };

  protected initEvents() {
    const container = this.element.querySelector('[data-type="table"]');

    container?.addEventListener("click", (event) => {
      const cell = (event.target as HTMLElement).closest("section");

      if (!cell) return;

      if (cell.dataset.type === "cell") this.handlerClick_cell(cell);
    });
  }
}
