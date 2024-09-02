import { ulid } from "ulid";
import { AtomicCalc } from "./calc";
import { TRelationsCell } from "../types";
import { MethodGetControllers } from "../symbols";

export class RelationsCalc {
  protected APP: AtomicCalc;

  protected relationships: Map<string, TRelationsCell>;

  constructor(app: AtomicCalc) {
    this.APP = app;

    this.relationships = new Map();
  }

  public deleteRelation(location: string) {
    const element = this.APP[
      MethodGetControllers
    ]().schema.elements.tableBody.querySelector(
      `[data-location="${location}"]`
    );

    if (!element) return;

    if (element instanceof Element && !(element instanceof HTMLElement)) return;

    if (!element.dataset.relation) return;

    let relation = this.relationships.get(element.dataset.relation);

    if (!relation) return;

    this.relationships.delete(relation.id);

    relation = undefined;

    element.removeAttribute("data-relation");
  }

  public updateRelation(id: string, inline: string, formulas: string) {
    let relation = this.relationships.get(id);

    if (!relation) return;

    if (relation.inline === inline) return;

    relation.inline = inline;
    relation.relations = inline.split("_");
    relation.formulas = formulas.split("");

    this.relationships.set(relation.id, relation);
  }

  public createRelation(
    location: string,
    relations: string[],
    formulas: string[]
  ) {
    if (relations.length === 0) return;

    const element = this.APP[
      MethodGetControllers
    ]().schema.elements.tableBody.querySelector(
      `[data-location="${location}"]`
    );

    if (!element) return;

    if (element instanceof Element && !(element instanceof HTMLElement)) return;

    if (element.dataset.relation) return;

    const { column, row } = element.dataset as any;

    const id = ulid();

    element.dataset.relation = id;

    this.relationships.set(id, {
      inline: relations.join("_"),
      relations,
      output: {
        location,
        column,
        row,
      },
      id,
      formulas,
    });
  }

  public getRelations(location: string) {
    return [...this.relationships.values()].filter(({ relations }) =>
      relations.includes(location)
    );
  }
}
