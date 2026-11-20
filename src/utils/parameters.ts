/**
 * Helpers for building Metabase query parameters
 */

import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

function hasId(param: unknown): boolean {
  const id = (param as { id?: unknown } | null)?.id;
  return typeof id === "string" && id.trim() !== "";
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * True when at least one parameter object has no usable `id`.
 */
export function needsParameterIds(parameters: unknown): boolean {
  return Array.isArray(parameters) && parameters.some((p) => isObject(p) && !hasId(p));
}

/**
 * Metabase 0.61.19 / 0.62.17 / 0.63.14 and later reject card query requests
 * (`POST /api/card/{id}/query/{format}` and the pivot endpoint) when an item
 * in `parameters` has no non-blank `id`. Return a copy of `parameters` in
 * which every item has one. Items that already carry a non-blank string `id`
 * are returned unchanged.
 *
 * Metabase matches a parameter to the card's own parameter by `id`, so for an
 * item without one, take the id of the card parameter with the same `target`
 * (or, failing that, the same `slug`). Only when nothing matches is a UUID
 * generated. `cardParameters` is the `parameters` array of the card.
 */
export function normalizeCardParameters(parameters: unknown, cardParameters: unknown = []): any[] {
  if (!Array.isArray(parameters)) {
    return [];
  }
  const known = Array.isArray(cardParameters) ? cardParameters.filter((p) => isObject(p) && hasId(p)) : [];
  return parameters.map((param) => {
    if (!isObject(param) || hasId(param)) {
      return param;
    }
    const match =
      (param.target !== undefined && known.find((c) => isDeepStrictEqual(c.target, param.target))) ||
      (typeof param.slug === "string" && param.slug !== "" && known.find((c) => c.slug === param.slug));
    return { ...param, id: match ? match.id : randomUUID() };
  });
}
