import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { iconColors, markerConfig } from "../../../config/config";
import { GITagItem } from "../../../models/Items";
import { Place } from "../../../models/Places";
import { GeocodeResult, searchOSM } from "../../../utils/geocode";
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
  onSelectGeocodeResult?: (result: GeocodeResult) => void;
  onClear?: () => void;
}

const LISTBOX_ID = "map-search-results";

export function MapSearch({
  places,
  giTags,
  onSelectResult,
  onSelectGeocodeResult,
  onClear,
}: MapSearchProps): JSX.Element {
  const map = useMap();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [osmResults, setOsmResults] = useState<GeocodeResult[]>([]);
  const [osmState, setOsmState] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [osmError, setOsmError] = useState<string>("");
  const geocodeControllerRef = useRef<AbortController | null>(null);

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

  useEffect(
    () => () => {
      geocodeControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const trimmedQuery = query.trim();
    geocodeControllerRef.current?.abort();
    geocodeControllerRef.current = null;
    setOsmResults([]);
    setOsmState("idle");
    setOsmError("");

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
  }, [query, results, osmResults, osmState]);

  const clearSearch = (): void => {
    geocodeControllerRef.current?.abort();
    geocodeControllerRef.current = null;
    setQuery("");
    setDebouncedQuery("");
    setOsmResults([]);
    setOsmState("idle");
    setOsmError("");
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

  const runOSMSearch = async (): Promise<void> => {
    const searchQuery = query.trim();
    if (searchQuery.length < 3) {
      setOsmError("Enter at least 3 characters to search OpenStreetMap.");
      setOsmState("error");
      setIsOpen(true);
      return;
    }
    if (osmState === "loading") return;

    geocodeControllerRef.current?.abort();
    const controller = new AbortController();
    geocodeControllerRef.current = controller;
    setOsmError("");
    setOsmResults([]);
    setOsmState("loading");
    setIsOpen(true);

    try {
      const foundResults = await searchOSM(searchQuery, controller.signal);
      if (!controller.signal.aborted) {
        setOsmResults(foundResults.slice(0, 5));
        setOsmState("loaded");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setOsmError(
          error instanceof Error
            ? error.message
            : "OpenStreetMap search failed. Please try again.",
        );
        setOsmState("error");
      }
    } finally {
      if (geocodeControllerRef.current === controller) {
        geocodeControllerRef.current = null;
      }
    }
  };

  const selectGeocodeResult = (result: GeocodeResult): void => {
    geocodeControllerRef.current?.abort();
    geocodeControllerRef.current = null;
    setQuery(result.displayName);
    setDebouncedQuery(result.displayName);
    setOsmResults([]);
    setOsmState("idle");
    setOsmError("");
    setActiveIndex(-1);
    setIsOpen(false);
    map.closePopup();

    if (result.boundingBox) {
      const [south, north, west, east] = result.boundingBox;
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { maxZoom: 13 },
      );
    } else {
      map.flyTo([result.lat, result.lng], 13, { duration: 1.2 });
    }
    onSelectGeocodeResult?.(result);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    const hasOsmAction = query.trim().length > 0;
    const selectableCount =
      results.length +
      (osmState === "loaded" ? osmResults.length : 0) +
      (hasOsmAction ? 1 : 0);

    if (event.key === "ArrowDown" && isOpen && selectableCount > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % selectableCount);
    } else if (event.key === "ArrowUp" && isOpen && selectableCount > 0) {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? selectableCount - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        selectResult(results[activeIndex]);
        return;
      }

      const osmStart = results.length;
      const osmEnd = osmStart + (osmState === "loaded" ? osmResults.length : 0);
      if (activeIndex >= osmStart && activeIndex < osmEnd) {
        selectGeocodeResult(osmResults[activeIndex - osmStart]);
        return;
      }

      if (hasOsmAction && (activeIndex === -1 || activeIndex === osmEnd)) {
        void runOSMSearch();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      geocodeControllerRef.current?.abort();
      geocodeControllerRef.current = null;
      setQuery("");
      setDebouncedQuery("");
      setOsmResults([]);
      setOsmState("idle");
      setOsmError("");
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
          aria-label="Search Places and GI tags"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `${LISTBOX_ID}-option-${encodeURIComponent(results[activeIndex].id)}`
              : osmState === "loaded" &&
                  activeIndex >= results.length &&
                  activeIndex < results.length + osmResults.length
                ? `${LISTBOX_ID}-osm-${activeIndex - results.length}`
                : activeIndex ===
                      results.length +
                        (osmState === "loaded" ? osmResults.length : 0) &&
                    query.trim().length > 0
                  ? `${LISTBOX_ID}-osm-action`
                  : undefined
          }
          placeholder="Search Places or GI tags"
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

      <div className="map-search__dropdown" hidden={!isOpen}>
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
            No matching saved places
          </div>
        ) : null}
        {osmState === "loading" && (
          <div className="map-search__message" role="status">
            Searching OpenStreetMap...
          </div>
        )}
        {osmState === "error" && (
          <div className="map-search__message" role="status">
            {osmError}
          </div>
        )}
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
                    {highlightMatch(entry.name, query).map((segment, index) =>
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
          {osmState === "loaded" && osmResults.length > 0 && (
            <li className="map-search__section-label" role="presentation">
              OpenStreetMap results
            </li>
          )}
          {osmState === "loaded" &&
            osmResults.map((result, resultIndex) => {
              const optionIndex = results.length + resultIndex;
              return (
                <li
                  className={`map-search__result map-search__result--osm${optionIndex === activeIndex ? " is-active" : ""}`}
                  id={`${LISTBOX_ID}-osm-${resultIndex}`}
                  key={`${result.displayName}-${result.lat}-${result.lng}`}
                  role="option"
                  aria-selected={optionIndex === activeIndex}
                  onMouseEnter={() => setActiveIndex(optionIndex)}
                  onMouseDownCapture={(event) => event.preventDefault()}
                  onClickCapture={() => selectGeocodeResult(result)}
                >
                  <span
                    className="map-search__dot map-search__dot--osm"
                    aria-hidden="true"
                  />
                  <span className="map-search__result-copy">
                    <strong className="map-search__name">
                      {result.displayName}
                    </strong>
                    <span className="map-search__details">
                      {result.type} · {result.lat.toFixed(4)},{" "}
                      {result.lng.toFixed(4)}
                    </span>
                  </span>
                </li>
              );
            })}
          {query.trim().length > 0 && (
            <li
              className={`map-search__result map-search__osm-action${activeIndex === results.length + (osmState === "loaded" ? osmResults.length : 0) ? " is-active" : ""}`}
              id={`${LISTBOX_ID}-osm-action`}
              role="option"
              aria-selected={
                activeIndex ===
                results.length + (osmState === "loaded" ? osmResults.length : 0)
              }
              onMouseEnter={() =>
                setActiveIndex(
                  results.length +
                    (osmState === "loaded" ? osmResults.length : 0),
                )
              }
              onMouseDownCapture={(event) => event.preventDefault()}
              onClickCapture={() => void runOSMSearch()}
            >
              <span className="map-search__osm-action-icon" aria-hidden="true">
                🌐
              </span>
              <span className="map-search__result-copy">
                <strong className="map-search__name">
                  Search OpenStreetMap for &quot;{query.trim()}&quot;
                </strong>
              </span>
            </li>
          )}
        </ul>
        {osmResults.length > 0 && (
          <div className="map-search__attribution">
            Data © OpenStreetMap contributors
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
