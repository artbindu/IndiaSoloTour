import { GITagItem } from "../models/Items";
import { Place } from "../models/Places";
import { hasValidCoordinates } from "./utils";

export type SearchKind = "place" | "gi";

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  item: Place | GITagItem;
  name: string;
  city: string;
  state: string;
  type: string;
  description: string;
  coordinates: [number, number];
  nameHaystack: string;
  locationHaystack: string;
  typeHaystack: string;
  descriptionHaystack: string;
  haystack: string;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Lowercases text and removes combining diacritical marks for search. */
export const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Creates a stable identifier from an item's kind, state, name, and coordinates. */
export const getSearchEntryId = (
  kind: SearchKind,
  item: Place | GITagItem,
): string =>
  `${kind}:${encodeURIComponent(item.state)}:${encodeURIComponent(item.name)}:${item.coordinates.lat},${item.coordinates.long}`;

/** Builds a normalized search index for valid place and GI-tag coordinates. */
export const buildSearchIndex = (
  places: Place[],
  giTags: GITagItem[],
): SearchEntry[] => {
  const entries: SearchEntry[] = [];
  const seenIds = new Set<string>();

  const addEntry = (kind: SearchKind, item: Place | GITagItem): void => {
    if (!hasValidCoordinates(item.coordinates)) {
      return;
    }

    const id = getSearchEntryId(kind, item);
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);

    const isPlace = kind === "place";
    const name = item.name;
    const city = isPlace ? (item as Place).city : (item as GITagItem).location;
    const state = item.state;
    const type = isPlace ? (item as Place).type : (item as GITagItem).Type;
    const description = item.description ?? "";
    const nameHaystack = normalizeText(name);
    const locationHaystack = normalizeText(`${city} ${state}`);
    const typeHaystack = normalizeText(type);
    const descriptionHaystack = normalizeText(description);

    entries.push({
      id,
      kind,
      item,
      name,
      city,
      state,
      type,
      description,
      coordinates: [item.coordinates.lat, item.coordinates.long],
      nameHaystack,
      locationHaystack,
      typeHaystack,
      descriptionHaystack,
      haystack: `${nameHaystack} ${locationHaystack} ${typeHaystack} ${descriptionHaystack}`,
    });
  };

  places.forEach((place) => addEntry("place", place));
  giTags.forEach((item) => addEntry("gi", item));
  return entries;
};

/** Returns matching entries ordered by name, location, type, then description relevance. */
export const searchIndex = (
  index: SearchEntry[],
  query: string,
  limit: number = 8,
): SearchEntry[] => {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery || limit <= 0) {
    return [];
  }

  return index
    .map((entry, originalIndex) => {
      let rank = -1;
      if (entry.nameHaystack.startsWith(normalizedQuery)) {
        rank = 0;
      } else if (entry.nameHaystack.includes(normalizedQuery)) {
        rank = 1;
      } else if (entry.locationHaystack.includes(normalizedQuery)) {
        rank = 2;
      } else if (entry.typeHaystack.includes(normalizedQuery)) {
        rank = 3;
      } else if (entry.descriptionHaystack.includes(normalizedQuery)) {
        rank = 4;
      }

      return { entry, rank, originalIndex };
    })
    .filter((result) => result.rank >= 0)
    .sort(
      (left, right) =>
        left.rank - right.rank || left.originalIndex - right.originalIndex,
    )
    .slice(0, limit)
    .map(({ entry }) => entry);
};

/** Splits text into renderable segments, highlighting a diacritics-insensitive match. */
export const highlightMatch = (
  text: string,
  query: string,
): HighlightSegment[] => {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) {
    return [{ text, match: false }];
  }

  const normalizedCharacters: string[] = [];
  const sourceStarts: number[] = [];
  const sourceEnds: number[] = [];
  let sourceOffset = 0;

  for (const character of text) {
    const normalizedCharacter = normalizeText(character);
    if (!normalizedCharacter) {
      if (sourceEnds.length > 0) {
        sourceEnds[sourceEnds.length - 1] = sourceOffset + character.length;
      }
      sourceOffset += character.length;
      continue;
    }

    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      normalizedCharacters.push(normalizedCharacter[index]);
      sourceStarts.push(sourceOffset);
      sourceEnds.push(sourceOffset + character.length);
    }
    sourceOffset += character.length;
  }

  const normalizedText = normalizedCharacters.join("");
  const matchStart = normalizedText.indexOf(normalizedQuery);
  if (matchStart < 0) {
    return [{ text, match: false }];
  }

  const matchEnd = matchStart + normalizedQuery.length;
  const sourceStart = sourceStarts[matchStart];
  const sourceEnd = sourceEnds[matchEnd - 1];
  const segments: HighlightSegment[] = [];

  if (sourceStart > 0) {
    segments.push({ text: text.slice(0, sourceStart), match: false });
  }
  segments.push({ text: text.slice(sourceStart, sourceEnd), match: true });
  if (sourceEnd < text.length) {
    segments.push({ text: text.slice(sourceEnd), match: false });
  }
  return segments;
};
