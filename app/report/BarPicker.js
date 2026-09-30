'use client';

import { useId, useMemo, useRef, useState } from 'react';

const NEW = 'new';
const NEW_LABEL = "My bar isn't listed";

// Lowercase, strip accents and punctuation so "kells" finds "Kell's" and "cafe" finds "Café".
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '');

const labelFor = (bar) => (bar ? `${bar.name}${bar.area ? ` (${bar.area})` : ''}` : '');

// A type-to-search bar picker. Submits the chosen bar's id as `name`.
export default function BarPicker({ bars, value, onChange, onAddNew, name = 'barId', invalid = false }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const selected = bars.find((b) => String(b.id) === String(value));
  const [query, setQuery] = useState(value === NEW ? NEW_LABEL : labelFor(selected));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const options = useMemo(() => {
    const q = norm(query);
    // While the box shows the current choice, list every bar.
    const showing = value === NEW ? NEW_LABEL : labelFor(selected);
    const terms = q && query !== showing ? q.split(/\s+/).filter(Boolean) : [];
    const matches = terms.length
      ? bars.filter((b) => {
          const hay = norm(`${b.name} ${b.area}`);
          return terms.every((t) => hay.includes(t));
        })
      : bars;
    // With no matches, offer to add exactly what they typed.
    const typed = query.trim();
    const addOption =
      terms.length && matches.length === 0
        ? { id: NEW, label: `Add "${typed}" as a new bar`, newName: typed }
        : { id: NEW, label: NEW_LABEL };
    return [...matches.map((b) => ({ id: String(b.id), label: labelFor(b) })), addOption];
  }, [bars, query, value, selected]);

  function choose(opt) {
    onChange(opt.id);
    if (opt.id === NEW) {
      if (opt.newName && onAddNew) onAddNew(opt.newName);
      setQuery(NEW_LABEL);
    } else {
      setQuery(opt.label);
    }
    setOpen(false);
  }

  function scrollTo(i) {
    const el = listRef.current?.querySelectorAll('[data-option]')?.[i];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      const i = Math.min(active + 1, options.length - 1);
      setActive(i);
      scrollTo(i);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = Math.max(active - 1, 0);
      setActive(i);
      scrollTo(i);
    } else if (e.key === 'Enter') {
      if (open && options[active]) {
        e.preventDefault(); // pick the bar instead of sending the form
        choose(options[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="picker">
      <input
        id="barSearch"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${uid}-opt-${options[active].id}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        placeholder="Type a bar's name, e.g. Spirit of 77"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange(''); // typing again clears the previous choice
        }}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onBlur={() => {
          setOpen(false);
          // Put the chosen bar's name back if the person typed and left without picking.
          if (value) setQuery(value === NEW ? NEW_LABEL : labelFor(selected));
        }}
        onKeyDown={onKeyDown}
      />
      <input type="hidden" name={name} value={value ?? ''} />
      {open && (
        <ul className="picker-list" role="listbox" id={listId} ref={listRef} aria-label="Bars">
          {options.length === 1 && options[0].newName && (
            <li className="picker-empty" role="presentation">
              No bars match "{query.trim()}".
            </li>
          )}
          {options.map((o, i) => (
            <li
              key={o.id}
              id={`${uid}-opt-${o.id}`}
              data-option={o.id}
              role="option"
              aria-selected={String(value) === o.id}
              className={`${i === active ? 'active' : ''}${o.id === NEW ? ' picker-new' : ''}`}
              onMouseDown={(e) => e.preventDefault()} // keep focus so the click registers
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
