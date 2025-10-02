import { useEffect, useRef, useState } from "react";

export default function CustomSelect({
  value,
  onChange,
  options = [], // [{value:'concise', label:'Concise'}, ...]
  className = "",
  buttonClass = "",
  listClass = "",
  itemClass = "",
  placeholder = "Select...",
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );

  const btnRef = useRef(null);
  const listRef = useRef(null);

  // close on outside click & Esc
  useEffect(() => {
    function handleDocClick(e) {
      if (
        !btnRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      )
        setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, value, options]);

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => Math.min(options.length - 1, (i ?? -1) + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => Math.max(0, (i ?? 1) - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && options[highlight]) {
        onChange(options[highlight].value);
        setOpen(false);
      } else {
        setOpen((o) => !o);
      }
    }
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      {/* trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 pr-9 text-left text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/30 ${buttonClass}`}
      >
        <span className={selected ? "" : "text-zinc-500"}>
          {selected?.label ?? placeholder}
        </span>
        {/* chevron */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>

      {/* list */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl select-scroll ${listClass}`}
        >
          {options.map((opt, idx) => {
            const isActive = idx === highlight;
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm
                  ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-200 hover:bg-zinc-800/70"
                  }
                  ${itemClass}`}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    className="h-4 w-4 text-indigo-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.07 7.182a1 1 0 0 1-1.44.01L3.29 9.26a1 1 0 1 1 1.42-1.41l3.08 3.1 6.36-6.458a1 1 0 0 1 1.414-.003z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
