import { AtomicCalc } from "./calc";

export class FormulaCell {
  [key: string]: any;

  protected APP: AtomicCalc;

  constructor(app: AtomicCalc) {
    this.APP = app;
  }
}
