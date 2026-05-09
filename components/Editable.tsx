"use client";

import { createElement, useEffect, useRef } from "react";

type Tag = "span" | "div" | "li" | "dd" | "td" | "h1" | "h3";

type Props = {
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  as?: Tag;
  className?: string;
};

export default function Editable({
  value,
  editing,
  onChange,
  as = "span",
  className,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!editing && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value, editing]);

  return createElement(as, {
    ref,
    className,
    contentEditable: editing,
    suppressContentEditableWarning: true,
    onBlur: () => {
      const next = ref.current?.textContent ?? "";
      if (next !== value) onChange(next);
    },
    children: value,
  });
}
