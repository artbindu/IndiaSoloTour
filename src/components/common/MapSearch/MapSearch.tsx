import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { iconColors, markerConfig } from "../../../config/config";
import { GITagItem } from "../../../models/Items";
import { Place } from "../../../models/Places";
import {
  buildSearchIndex,
  highlightMatch,
  normalizeText,
  searchIndex,
  SearchEntry,
} from "../../../utils/search";
import { getHeritageIcon } from "../../../utils/utils";
import "./MapSearch.css";

interface MapSearchProps {
  places: Place[];
  giTags: GITagItem[];
  onSelectResult?: (entry: SearchEntry) => void;
  onClear?: () => void;
}

const LISTBOX_ID = "map-search-results";

export function MapSearch({
  places,
  giTags,
  onSelectResult,
  onClear,
}: MapSearchProps): JSX.Element {
  const map = useMap();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const index = useMemo(
    () => buildSearchIndex(places, giTags),
    [places, giTags],
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    L.DomEvent.disableClickPropagation(wrapper);
    L.DomEvent.disableScrollPropagation(wrapper);
    L.DomEvent.on(wrapper, "keydown", L.DomEvent.stopPropagation);

    return () => {
      L.DomEvent.off(wrapper, "keydown", L.DomEvent.stopPropagation);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setDebouncedQuery(trimmedQuery);
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const isCurrentQueryDebounced =
    normalizeText(query.trim()) === normalizeText(debouncedQuery.trim());
  const queryIsLongEnough = query.trim().length >= 2;
  const results = useMemo(
    () =>
      isCurrentQueryDebounced && queryIsLongEnough
        ? searchIndex(index, debouncedQuery, 8)
        : [],
    [index, debouncedQuery, isCurrentQueryDebounced, queryIsLongEnough],
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  const clearSearch = (): void => {
    setQuery("");
    setDebouncedQuery("");
    setActiveIndex(-1);
    setIsOpen(true);
    map.closePopup();
    onClear?.();
    inputRef.current?.focus();
  };

  const selectResult = (entry: SearchEntry): void => {
    setQuery(entry.name);
    setDebouncedQuery(entry.name);
    setActiveIndex(-1);
    setIsOpen(false);
    map.closePopup();
    map.flyTo(entry.coordinates, 12, { duration: 1.2 });
    onSelectResult?.(entry);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === "ArrowDown" && isOpen && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && isOpen && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const entry = results[activeIndex];
      if (entry) selectResult(entry);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(-1);
      setIsOpen(false);
      map.closePopup();
      onClear?.();
    }
  };

  const getHeritage = (entry: SearchEntry): string =>
    entry.kind === "place"
      ? getHeritageIcon((entry.item as Place).heritage)
      : "";

  return (
    <div className="map-search" ref={wrapperRef}>
      <div className="map-search__input-wrap">
        <span className="map-search__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          className="map-search__input"
          type="search"
          role="combobox"
          aria-label="Search places and GI tags"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `${LISTBOX_ID}-option-${encodeURIComponent(results[activeIndex].id)}`
              : undefined
          }
          placeholder="Search places or GI tags"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDownCapture={handleKeyDown}
        />
        {query && (
          <button
            className="map-search__clear"
            type="button"
            aria-label="Clear search"
            title="Clear search"
            onMouseDownCapture={(event) => event.preventDefault()}
            onClickCapture={clearSearch}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="map-search__dropdown">
          {query.trim().length < 2 ? (
            <div className="map-search__message" role="status">
              Type at least 2 characters
            </div>
          ) : !isCurrentQueryDebounced ? (
            <div className="map-search__message" role="status">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="map-search__message" role="status">
              No results
            </div>
          ) : null}
          <ul
            className="map-search__results"
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Search results"
          >
            {results.map((entry, resultIndex) => {
              const color =
                entry.kind === "gi"
                  ? iconColors["GI Tags"]
                  : iconColors[entry.type] || markerConfig.defaultColor;
              const optionId = `${LISTBOX_ID}-option-${encodeURIComponent(entry.id)}`;
              const heritage = getHeritage(entry);

              return (
                <li
                  className={`map-search__result${resultIndex === activeIndex ? " is-active" : ""}`}
                  id={optionId}
                  key={entry.id}
                  role="option"
                  aria-selected={resultIndex === activeIndex}
                  onMouseEnter={() => setActiveIndex(resultIndex)}
                  onMouseDownCapture={(event) => event.preventDefault()}
                  onClickCapture={() => selectResult(entry)}
                >
                  <span
                    className="map-search__dot"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="map-search__result-copy">
                    <strong className="map-search__name">
                      {highlightMatch(entry.name, query).map(
                        (segment, index) =>
                          segment.match ? (
                            <mark key={index}>{segment.text}</mark>
                          ) : (
                            <React.Fragment key={index}>
                              {segment.text}
                            </React.Fragment>
                          ),
                      )}
                    </strong>
                    <span className="map-search__details">
                      {entry.city}
                      {entry.city && entry.state ? ", " : ""}
                      {entry.state} · {entry.type}
                    </span>
                  </span>
                  {heritage && (
                    <span
                      className="map-search__heritage"
                      aria-label="Heritage site"
                    >
                      {heritage}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
