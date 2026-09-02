"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface DirectoryEmployee {
  name: string;
  email: string;
}

interface EmployeeNameInputProps {
  value: string;

  /* Typing by hand stays allowed — the directory only suggests. */
  onChange: (name: string) => void;

  /* Fired when a suggestion is picked, so the caller can fill the email too. */
  onSelect: (employee: DirectoryEmployee) => void;

  className: string;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

/* Enough characters for the backend to answer, and few enough to feel instant */
const MIN_QUERY_LENGTH = 2;

const DEBOUNCE_MS = 250;

export default function EmployeeNameInput({
  value,
  onChange,
  onSelect,
  className,
  placeholder,
  name,
  id,
  required,
  disabled,
}: EmployeeNameInputProps) {
  const [suggestions, setSuggestions] = useState<
    DirectoryEmployee[]
  >([]);

  const [isOpen, setIsOpen] = useState(false);

  const [highlightedIndex, setHighlightedIndex] =
    useState(-1);

  /*
   * The typed text drives the lookup, but a picked suggestion must not
   * immediately search for itself and reopen the list.
   */
  const [query, setQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const listboxId = `${useId()}-employee-suggestions`;

  // ==========================================================
  // FETCH SUGGESTIONS
  // ==========================================================

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/employees/search?q=${encodeURIComponent(
            trimmed
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Employee lookup failed: ${response.status}`
          );
        }

        const data: DirectoryEmployee[] =
          await response.json();

        if (cancelled) {
          return;
        }

        setSuggestions(data);
        setHighlightedIndex(-1);
        setIsOpen(data.length > 0);
      } catch (error) {
        console.error(
          "Error searching employees:",
          error
        );

        if (!cancelled) {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // ==========================================================
  // CLOSE ON OUTSIDE CLICK
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [isOpen]);

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    setQuery(nextValue);

    if (nextValue.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const pickEmployee = (employee: DirectoryEmployee) => {
    onSelect(employee);

    // Keep the list closed until the field is edited again
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setHighlightedIndex((index) =>
        index + 1 >= suggestions.length ? 0 : index + 1
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setHighlightedIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );

      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      // Only swallow the submit when a suggestion is actually highlighted
      event.preventDefault();

      pickEmployee(suggestions[highlightedIndex]);

      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-autocomplete="list"
        className={className}
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((employee, index) => (
            <li key={`${employee.email}-${index}`}>
              <button
                type="button"
                role="option"
                aria-selected={
                  index === highlightedIndex
                }
                onMouseEnter={() =>
                  setHighlightedIndex(index)
                }
                /*
                 * mousedown, not click: the input's blur would otherwise
                 * close the list before the click lands.
                 */
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickEmployee(employee);
                }}
                className={`block w-full px-3 py-2 text-left transition ${
                  index === highlightedIndex
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-medium text-slate-900">
                  {employee.name}
                </span>

                <span className="block text-xs text-slate-500">
                  {employee.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
