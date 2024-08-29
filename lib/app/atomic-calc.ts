import { ulid } from "ulid";

import { TComputedFormula } from "./types/index";

export class AtomicCalc {
  private element: HTMLElement;
  private focusElement?: HTMLElement;

  private options = {
    rows: 0,
    columns: 0,
    row_size: 30,
    column_size: 100,
  } as {
    rows: number;
    columns: number;
    row_size: number;
    column_size: number;
  };

  private keyNoActions: Record<string, boolean> = {
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
        horizontal_align: "left" | "center" | "right";
        vertical_align: "top" | "middle" | "bottom";
        background_cell: string;
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
    focus: false,
    select_column: false,
    select_row: false,
    select_all: false,
    formula: false,
  };

  private functions = {
    SUM: (...abstracts: TComputedFormula[] | number[]) => {
      let result = 0;

      abstracts.forEach((abstract) => {
        if (typeof abstract === "number") {
          result += abstract;
        } else {
          result += abstract.value;
        }
      });

      return result;
    },
    RES: (...abstracts: TComputedFormula[] | number[]) => {
      let result = 0;

      abstracts.forEach((abstract) => {
        if (typeof abstract === "number") {
          result -= abstract;
        } else {
          result -= abstract.value;
        }
      });

      return result;
    },
    MUL: (...abstracts: TComputedFormula[] | number[]) => {
      let result = 0;

      abstracts.forEach((abstract) => {
        if (typeof abstract === "number") {
          result *= abstract;
        } else {
          result *= abstract.value;
        }
      });

      return result;
    },
    DIV: (...abstracts: TComputedFormula[] | number[]) => {
      let result = 0;

      abstracts.forEach((abstract) => {
        if (typeof abstract === "number") {
          result /= abstract;
        } else {
          result /= abstract.value;
        }
      });

      return result;
    },
    MOD: (...abstracts: TComputedFormula[] | number[]) => {
      let result = 0;

      abstracts.forEach((abstract) => {
        if (typeof abstract === "number") {
          result %= abstract;
        } else {
          result %= abstract.value;
        }
      });

      return result;
    },
    ARRAY: (position: string, ...abstracts: TComputedFormula[]) => {
      const refCell = this.element.querySelector(
        `[data-var="${position}"]`
      ) as HTMLElement;
      const x = Number(refCell.dataset.x);
      const y = Number(refCell.dataset.y);

      const totalColumns = [
        ...new Set(
          abstracts.map(({ cell }) => cell.replace(/\d+/g, ""))
        ).values(),
      ].length;

      let column = 0;
      const middle = abstracts.length / totalColumns;

      const relationFormula: string[] = [];

      abstracts.forEach(({ value, cell }, index) => {
        const cellElement = this.element.querySelector(
          `[data-x="${x + column}"][data-y="${y + (index % middle)}"]`
        ) as HTMLElement;

        relationFormula.push(cell);

        const span = cellElement.querySelector("span") as HTMLElement;

        span.textContent = value;

        if (index % middle === middle - 1) column++;
      });

      this.relationsFormulas["ARRAY"].set(position, relationFormula);

      return abstracts[0].value;
    },
    SQRT: (abstract: number | TComputedFormula) => {
      let result = 0;

      if (typeof abstract === "number") {
        result = Math.sqrt(abstract);
      } else {
        result = Math.sqrt(abstract.value);
      }

      return result;
    },
    CHARACTER: (abstract: number | TComputedFormula) => {
      let result = "";

      if (typeof abstract === "number") {
        result = String.fromCharCode(abstract);
      } else {
        result = String.fromCharCode(abstract.value);
      }

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

  private relationsFormulas: Record<string, Map<string, string[]>> = {
    ARRAY: new Map<string, string[]>(),
  };

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

    this.options.columns = columns;
    this.options.rows = rows;
  }

  setColumnSize(size: number) {
    this.options.column_size = size;
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

    container.classList.add("table-main");

    const columnSize = `repeat(${this.options.columns + 1}, ${
      this.options.column_size
    }px)`;

    const sectionHead = document.createElement("section");

    sectionHead.dataset.type = "table-head";

    sectionHead.classList.add("table-section");

    sectionHead.style.gridTemplateColumns = columnSize;

    const baseCell = document.createElement("section");

    baseCell.dataset.type = "cell-base";
    baseCell.dataset.location = "head-cell";

    baseCell.classList.add("cell-main", "cell-base");

    sectionHead.appendChild(baseCell);

    const sectionBody = document.createElement("section");

    sectionBody.dataset.type = "table-body";

    sectionBody.classList.add("table-section");

    sectionBody.style.gridTemplateColumns = columnSize;

    sectionBody.style.gridTemplateRows = `repeat(${this.options.rows}, ${this.options.row_size}px)`;

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

      cellNumber.classList.add("cell-main", "cell-number");

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

      cellChar.classList.add("cell-main", "cell-char");

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

        if (row >= this.options.rows - 1) {
          cell.style.borderBottom = "none";
        }

        cell.classList.add("cell");

        cell.innerHTML = `
        <span>${this.state[row][column].computed}</span>
        <input type="text" value="${this.state[row][column].value}"/>
        `;

        sectionBody?.appendChild(cell);
      });
    });
  }

  protected computedMath(cellVar: string) {
    const { x, y } = (
      this.element.querySelector(`[data-var="${cellVar}"]`) as any
    ).dataset;

    const process = this.processMatch(this.state[y][x].value, cellVar);

    return {
      value: process === undefined ? 0 : process,
      cellVar,
    };
  }

  protected makeRange(vars: string[]) {
    const result: Array<{
      x: number;
      y: number;
      cell: string;
      value: any;
    }> = [];

    let startsChar = vars[0].replace(/\d+/g, "");
    let finishChar = vars[1].replace(/\d+/g, "");

    let startsNumber = Number(vars[0].replace(/[A-Z]/g, ""));
    let finishNumber = Number(vars[1].replace(/[A-Z]/g, ""));

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
          value: this.processMatch(
            this.state[cell.y][cell.x].value,
            cell.cellVar
          ),
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
          value: this.processMatch(
            this.state[cell.y][cell.x].value,
            cell.cellVar
          ),
        });
      }
    }

    if (startsChar !== finishChar && startsNumber !== finishNumber) {
      if (startsNumber > finishNumber) {
        vars = vars.reverse();

        startsNumber = Number(vars[0].replace(/[A-Z]/g, ""));
      }

      const toColumn = Number(
        (this.element.querySelector(`[data-var="${vars[1]}"]`) as HTMLElement)
          .dataset.x
      );

      const toRow = Number(
        (this.element.querySelector(`[data-var="${vars[1]}"]`) as HTMLElement)
          .dataset.y
      );

      const fromColumn = Number(
        (this.element.querySelector(`[data-var="${vars[0]}"]`) as HTMLElement)
          .dataset.x
      );

      for (let column = fromColumn; column < toColumn + 1; column++) {
        for (let row = startsNumber - 1; row < toRow + 1; row++) {
          const cell = this.state[row][column];

          result.push({
            cell: cell.cellVar,
            x: cell.x,
            y: cell.y,
            value: this.processMatch(
              this.state[cell.y][cell.x].value,
              cell.cellVar
            ),
          });
        }
      }
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

    const vars = data.match(/[A-Z]+\d+(:[A-Z]+\d+)?/g) ?? [];

    let result = data;
    const listComputed: Array<{
      value: any;
      cellVar: string;
    }> = [];
    const relations: string[] = [];

    const reserveFunctions = "(SUM|RES|DIV|MUL|MOD|ARRAY)";

    [...new Set(vars).values()].forEach((cellVar) => {
      if (/[A-Z]+\d+:[A-Z]+\d+/g.test(cellVar)) {
        const rangeVars = cellVar.match(/[A-Z]+\d/g) ?? [];
        const range = this.makeRange(rangeVars);

        if (
          new RegExp(
            `${reserveFunctions}\\([^\\)]*${cellVar}[^\\)]*\\)`,
            "i"
          ).test(result)
        ) {
          result = result.replace(cellVar, JSON.stringify(range).slice(1, -1));
        } else {
          result = result.replace(cellVar, JSON.stringify(range));
        }

        result = result.replace(/ARRAY\(/g, `ARRAY('${position}',`);

        relations.push(...range.map(({ cell }) => cell));
      } else {
        const computed = this.computedMath(cellVar);

        listComputed.push(computed);

        relations.push(cellVar);
      }
    });

    this.makeRelation(position, relations);

    const code = `
    const window = undefined;
    const document = undefined;
    const alert = undefined;
    const confirm = undefined;
    const prompt = undefined;
    const setTimeout = undefined;
    const setInterval = undefined;
    const fetch = undefined;
    const XMLHttpRequest = undefined;
    const localStorage = undefined;
    const sessionStorage = undefined;
    const indexedDB = undefined;
    const WebSocket = undefined;
    const EventSource = undefined;
    const Worker = undefined;
    const SharedWorker = undefined;
    const Notification = undefined;
    const requestAnimationFrame = undefined;
    const cancelAnimationFrame = undefined;
    const history = undefined;
    const location = undefined;
    const navigator = undefined;
    const screen = undefined;
    const performance = undefined;
    const geolocation = undefined;
    const FileReader = undefined;
    const MutationObserver = undefined;
    const ResizeObserver = undefined;
    const IntersectionObserver = undefined;
    const Crypto = undefined;
    const AudioContext = undefined;
    const CanvasRenderingContext2D = undefined;
    const OffscreenCanvas = undefined;
    const SpeechRecognition = undefined;
    const MediaRecorder = undefined;
    const MediaStream = undefined;
    const URL = undefined;
    const Blob = undefined;
    const Image = undefined;
    const ImageBitmap = undefined;
    const DeviceOrientationEvent = undefined;
    const DeviceMotionEvent = undefined;
    const MediaQueryList = undefined;
    const MediaQueryListEvent = undefined;
    const customElements = undefined;
    const ShadowRoot = undefined;
    const HTMLTemplateElement = undefined;
    const HTMLSlotElement = undefined;
    const CSS = undefined;
    const CSSStyleSheet = undefined;
    const Audio = undefined;
    const Video = undefined;
    const HTMLAudioElement = undefined;
    const HTMLVideoElement = undefined;
    const HTMLCanvasElement = undefined;
    const WebGLRenderingContext = undefined;
    const WebGL2RenderingContext = undefined;
    const Cache = undefined;
    const CacheStorage = undefined;
    const clipboard = undefined;
    const SpeechSynthesis = undefined;
    const SpeechSynthesisUtterance = undefined;
    const BatteryManager = undefined;
    const NetworkInformation = undefined;
    const NotificationEvent = undefined;
    const DataTransfer = undefined;
    const DataTransferItem = undefined;
    const DataTransferItemList = undefined;
    const FormData = undefined;
    const Headers = undefined;
    const Request = undefined;
    const Response = undefined;
    const AbortController = undefined;
    const AbortSignal = undefined;
    const Bluetooth = undefined;
    const PaymentRequest = undefined;
    const PaymentResponse = undefined;
    const PaymentAddress = undefined;
    const URLSearchParams = undefined;
    const DOMParser = undefined;
    const XMLSerializer = undefined;
    const TextDecoder = undefined;
    const TextEncoder = undefined;
    const BroadcastChannel = undefined;
    const MessageChannel = undefined;
    const MessagePort = undefined;
    const MessageEvent = undefined;
    const NotificationPermission = undefined;
    const PerformanceObserver = undefined;
    const PerformanceEntry = undefined;
    const PerformanceNavigation = undefined;
    const PerformanceResourceTiming = undefined;
    const PerformanceTiming = undefined;
    const ServiceWorker = undefined;
    const ServiceWorkerContainer = undefined;
    const ServiceWorkerRegistration = undefined;
    const PushManager = undefined;
    const PushSubscription = undefined;
    const File = undefined;
    const FileList = undefined;
    const DataView = undefined;
    const ArrayBuffer = undefined;
    const Int8Array = undefined;
    const Uint8Array = undefined;
    const Uint8ClampedArray = undefined;
    const Int16Array = undefined;
    const Uint16Array = undefined;
    const Int32Array = undefined;
    const Uint32Array = undefined;
    const Float32Array = undefined;
    const Float64Array = undefined;
    const BigInt64Array = undefined;
    const BigUint64Array = undefined;
    const WebAssembly = undefined;
    const importScripts = undefined;
    const JSON = undefined;
    const atob = undefined;
    const btoa = undefined;
    const console = undefined; 

        ${listComputed
          .map(({ cellVar, value }) => `const ${cellVar} = ${value};`)
          .join("\n")}

        const _ = ${result};

        if (typeof _ === 'object') throw new Error("is object")

        return _
    `;

    const execute = new Function(
      "{ SUM, RES, DIV, MUL, MOD, ARRAY, SQRT, CHARACTER }, position",
      code
    );

    let output;

    try {
      output = execute(this.functions, position);
    } catch (error) {
      console.log(error);

      output = "!ERROR";
    }

    return output;
  }

  protected processFormula(position: string) {
    console.log(position);
  }

  protected processValue(value: any, position: string) {
    this.processRelation(position);

    if (value === "") {
      this.processFormula(position);
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
      row.classList.add("cell-select");
      column.classList.add("cell-select");
    }

    if (action === "remove") {
      row.classList.remove("cell-select");
      column.classList.remove("cell-select");
    }
  };

  protected removeSelectCell = () => {
    const element = this.element.querySelector(
      `[data-var="${this.selection.cell}"]`
    ) as HTMLElement;
    const span = element.querySelector("span");

    this.selectColumnAndRow(this.selection.cell, "remove");

    this.stateElement.select = false;

    this.selection.cell = "";

    span?.classList.remove("cell-focus");
  };

  protected handlerClick_formulaCell = (element: HTMLElement) => {
    const cellVar = element.dataset.var as any;

    if (cellVar === this.selection.cell) return;

    if (this.focusElement) {
      const input = this.focusElement as HTMLInputElement;

      input.value += cellVar;
      input.focus();
    }
  };

  protected handlerClick_cell = (element: HTMLElement) => {
    const span = element.querySelector("span");
    const cellVar = element.dataset.var as any;

    if (this.selection.cell && this.selection.cell !== cellVar)
      this.removeSelectCell();

    this.stateElement.select = true;

    this.selection.cell = cellVar;

    this.selectColumnAndRow(cellVar, "add");

    span?.classList.add("cell-focus");
  };

  protected handlerInput_cell = () => {
    const element = this.element.querySelector(
      `[data-var="${this.selection.cell}"]`
    ) as HTMLElement;
    const input = element.querySelector("input");

    if (!input) return;

    if (input.value.startsWith("=")) {
      this.stateElement.formula = true;
      this.focusElement = input;
    } else {
      this.stateElement.formula = false;
      this.focusElement = undefined;
    }
  };

  protected handlerClick_inputCell = (element: HTMLElement) => {
    const input = element.querySelector("input");

    this.stateElement.select = false;

    this.stateElement.focus = true;

    if (!input) return;

    input.classList.add("cell-focus");

    input.focus();

    input.setSelectionRange(input.value.length, input.value.length);

    input.addEventListener("input", this.handlerInput_cell);

    input.addEventListener(
      "blur",
      () => {
        if (!this.stateElement.formula) {
          this.closeFormula(input, element);
        }
      },
      { once: true }
    );
  };

  protected removeSelectAll() {
    const columns = this.element.querySelectorAll(`[data-type="cell-char"]`);
    const rows = this.element.querySelectorAll(`[data-type="cell-number"]`);
    const cells = this.element.querySelectorAll(`[data-type="cell"]`);

    columns.forEach((child) => {
      child.classList.remove("location-select");
    });

    rows.forEach((child) => {
      child.classList.remove("location-select");
    });

    cells.forEach((child) => {
      child.classList.remove("cell-select");
    });
  }

  protected removeSelectRow() {
    const element = this.element.querySelector(
      `[data-number="${this.selection.row}"]`
    ) as HTMLElement;
    const row = element.dataset.row as any;

    element.classList.remove("location-select");

    const columns = this.element.querySelectorAll(`[data-type="cell-char"]`);

    columns.forEach((child) => {
      child.classList.remove("cell-select");
    });

    this.state[row].forEach((state) => {
      const cell = this.element.querySelector(
        `[data-var="${state.cellVar}"]`
      ) as HTMLElement;

      cell.classList.remove("cell-select");
    });

    this.selection.row = "";
  }

  protected removeSelectColumn() {
    const element = this.element.querySelector(
      `[data-char="${this.selection.column}"]`
    ) as HTMLElement;
    const column = element.dataset.column as any;

    element.classList.remove("location-select");

    const rows = this.element.querySelectorAll(`[data-type="cell-number"]`);

    rows.forEach((child) => {
      child.classList.remove("cell-select");
    });

    this.state.forEach((columns) => {
      const state = columns[column];
      const cell = this.element.querySelector(
        `[data-var="${state.cellVar}"]`
      ) as HTMLElement;

      cell.classList.remove("cell-select");
    });

    this.selection.column = "";
  }

  protected handlerClick_allCell() {
    const columns = this.element.querySelectorAll(`[data-type="cell-char"]`);
    const rows = this.element.querySelectorAll(`[data-type="cell-number"]`);
    const cells = this.element.querySelectorAll(`[data-type="cell"]`);

    this.stateElement.select_all = true;

    columns.forEach((child) => {
      child.classList.add("location-select");
    });

    rows.forEach((child) => {
      child.classList.add("location-select");
    });

    cells.forEach((child) => {
      child.classList.add("cell-select");
    });

    let result = "";

    document.addEventListener("copy", async () => {
      for (let row = 0; row < this.state.length; row++) {
        for (let column = 0; column < this.state[row].length; column++) {
          const state = this.state[row][column];
          if (state.computed) result += state.computed + "\t";
        }
        result = result.trim() + "\n";
      }

      await navigator.clipboard.writeText(result.trim());
    });
  }

  protected handlerClick_allCellByRow(element: HTMLElement) {
    const row = element.dataset.row as any;
    const number = element.dataset.number as any;

    if (this.selection.row && this.selection.row !== number)
      this.removeSelectRow();

    if (this.selection.row === row) return;

    this.selection.row = number;

    this.stateElement.select_row = true;

    element.classList.add("location-select");

    const columns = this.element.querySelectorAll(`[data-type="cell-char"]`);

    columns.forEach((child) => {
      child.classList.add("cell-select");
    });

    this.state[row].forEach((state) => {
      const cell = this.element.querySelector(
        `[data-var="${state.cellVar}"]`
      ) as HTMLElement;

      cell.classList.add("cell-select");
    });

    let result = "";

    document.addEventListener("copy", async () => {
      this.state[row].forEach((state) => {
        if (state.computed) result += state.computed + "\t";
      });

      await navigator.clipboard.writeText(result.trim());
    });
  }

  protected handlerClick_allCellByColumn(element: HTMLElement) {
    const column = element.dataset.column as any;
    const char = element.dataset.char as any;

    if (this.selection.column && this.selection.column !== char)
      this.removeSelectColumn();

    if (this.selection.column === char) return;

    this.selection.column = char;

    this.stateElement.select_column = true;

    element.classList.add("location-select");

    const rows = this.element.querySelectorAll(`[data-type="cell-number"]`);

    rows.forEach((child) => {
      child.classList.add("cell-select");
    });

    this.state.forEach((columns) => {
      const state = columns[column];
      const cell = this.element.querySelector(
        `[data-var="${state.cellVar}"]`
      ) as HTMLElement;

      cell.classList.add("cell-select");
    });

    let result = "";

    document.addEventListener("copy", async () => {
      this.state.forEach((columns) => {
        const state = columns[column];

        if (state.computed) result += state.computed + "\n";
      });

      await navigator.clipboard.writeText(result.trim());
    });
  }

  protected closeFormula(input: HTMLInputElement, element: HTMLElement) {
    input.removeEventListener("input", this.handlerInput_cell);

    input.classList.remove("cell-focus");

    this.stateElement.focus = false;

    this.stateElement.select = true;

    this.processInput(input.value, element);
  }

  protected deleteContent() {
    const element = this.element.querySelector(
      `[data-var="${this.selection.cell}"]`
    ) as HTMLElement;
    const { x, y } = element.dataset as any;
    const span = element.querySelector("span") as HTMLElement;
    const input = element.querySelector("input") as HTMLInputElement;

    const state = this.state[y][x];

    state.computed = "";
    state.value = "";

    this.state[y][x] = state;

    span.textContent = "";
    input.value = "";
  }

  protected handlerKeyboard_cell(event: KeyboardEvent) {
    const element = this.element.querySelector(
      `[data-var="${this.selection.cell}"]`
    ) as HTMLElement;
    const { x, y } = element.dataset as any;

    if (event.code === "Escape") {
      this.stateElement.formula = false;

      const input = document.activeElement as HTMLElement;

      event.preventDefault();

      setTimeout(function () {
        input.blur();
      }, 0);

      return;
    }

    if (event.code === "Tab") {
      let newSelectionState;
      let newX;

      newX = Number(x) + 1;

      if (newX > this.state[y].length) return;

      newSelectionState = this.state[y][newX];

      if (newSelectionState) {
        const elementSelectNew = this.element.querySelector(
          `[data-var="${newSelectionState.cellVar}"]`
        ) as HTMLElement;

        const input = document.activeElement as HTMLInputElement;

        event.preventDefault();

        if (this.stateElement.formula) {
          this.closeFormula(input, element);
        }

        this.stateElement.formula = false;
        this.focusElement = undefined;

        setTimeout(function () {
          input.blur();
        }, 0);

        this.handlerClick_cell(elementSelectNew);
      }

      return;
    }

    if (
      (event.code === "Enter" || event.code === "NumpadEnter") &&
      this.stateElement.focus
    ) {
      let newSelectionState;
      let newY;

      newY = Number(y) + 1;

      if (newY === this.state.length) return;

      newSelectionState = this.state[newY][x];

      if (newSelectionState) {
        const elementSelectNew = this.element.querySelector(
          `[data-var="${newSelectionState.cellVar}"]`
        ) as HTMLElement;

        const input = document.activeElement as HTMLInputElement;

        event.preventDefault();

        if (this.stateElement.formula) {
          this.closeFormula(input, element);
        }

        this.stateElement.formula = false;
        this.focusElement = undefined;

        setTimeout(function () {
          input.blur();
        }, 0);

        this.handlerClick_cell(elementSelectNew);
      }

      return;
    }

    if (this.selection.cell && !this.stateElement.focus) {
      let newSelectionState;
      let newX;
      let newY;

      // console.log(event.getModifierState("NumLock"));

      if (this.keyNoActions[event.code]) {
        if (event.code === "F1") event.preventDefault();

        return;
      } else if (["Backspace", "Delete"].includes(event.code)) {
        this.deleteContent();
      } else if (
        ["ControlLeft", "ControlRight", "AltRight"].includes(event.code)
      ) {
      } else if (["ShiftLeft", "ShiftRight"].includes(event.code)) {
      } else if (event.code === "Enter" || event.code === "NumpadEnter") {
        this.handlerClick_inputCell(element);
      } else if (event.code === "ArrowLeft") {
        newX = Number(x) - 1;

        if (newX === -1) return;

        newSelectionState = this.state[y][newX];
      } else if (event.code === "ArrowRight") {
        newX = Number(x) + 1;

        if (newX > this.state[y].length) return;

        newSelectionState = this.state[y][newX];
      } else if (event.code === "ArrowUp") {
        newY = Number(y) - 1;

        if (newY === -1) return;

        newSelectionState = this.state[newY][x];
      } else if (event.code === "ArrowDown") {
        newY = Number(y) + 1;

        if (newY === this.state.length) return;

        newSelectionState = this.state[newY][x];
      } else {
        this.deleteContent();
        this.handlerClick_inputCell(element);
      }

      if (newSelectionState) {
        const elementSelectNew = this.element.querySelector(
          `[data-var="${newSelectionState.cellVar}"]`
        ) as HTMLElement;

        this.handlerClick_cell(elementSelectNew);
      }
    }
  }

  protected initEvents() {
    const container = this.element.querySelector('[data-type="table"]');

    window.addEventListener("keydown", (event) => {
      if (this.stateElement.select || this.stateElement.focus) {
        this.handlerKeyboard_cell(event);
      }
    });

    container?.addEventListener("click", (event: any) => {
      const cell = (event.target as HTMLElement).closest("section");

      if (!cell) return;

      if (cell.dataset.type === "cell-base" && !this.stateElement.formula) {
        if (this.stateElement.select) {
          this.removeSelectCell();
        }

        if (this.stateElement.select_row) {
          this.removeSelectRow();
          this.stateElement.select_row = false;
        }

        if (this.stateElement.select_column) {
          this.removeSelectColumn();
          this.stateElement.select_column = false;
        }

        this.handlerClick_allCell();
      }

      if (cell.dataset.type === "cell-char" && !this.stateElement.formula) {
        if (this.stateElement.select) {
          this.removeSelectCell();
        }

        if (this.stateElement.select_all) {
          this.removeSelectAll();
          this.stateElement.select_all = false;
        }

        if (this.stateElement.select_row) {
          this.removeSelectRow();
          this.stateElement.select_row = false;
        }

        this.stateElement.select_column = true;
        this.handlerClick_allCellByColumn(cell);
      }

      if (cell.dataset.type === "cell-number" && !this.stateElement.formula) {
        if (this.stateElement.select) {
          this.removeSelectCell();
        }

        if (this.stateElement.select_all) {
          this.removeSelectAll();
          this.stateElement.select_all = false;
        }

        if (this.stateElement.select_column) {
          this.removeSelectColumn();
          this.stateElement.select_column = false;
        }

        this.handlerClick_allCellByRow(cell);
      }

      if (cell.dataset.type === "cell" && !this.stateElement.formula) {
        if (this.stateElement.select_all) {
          this.removeSelectAll();
          this.stateElement.select_all = false;
        }

        if (this.stateElement.select_column) {
          this.removeSelectColumn();
          this.stateElement.select_column = false;
        }

        if (this.stateElement.select_row) {
          this.removeSelectRow();
          this.stateElement.select_row = false;
        }

        if (event.detail === 2) this.handlerClick_inputCell(cell);
        if (event.detail === 1) this.handlerClick_cell(cell);
      }

      if (cell.dataset.type === "cell" && this.stateElement.formula) {
        this.handlerClick_formulaCell(cell);
      }
    });
  }
}
