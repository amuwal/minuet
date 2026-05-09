"use client";

import { Fragment } from "react";
import Icon from "./Icon";
import { STEPS } from "@/lib/constants";

type Props = {
  current: number;
  onStepClick: (index: number) => void;
};

export default function Stepper({ current, onStepClick }: Props) {
  return (
    <nav className="stepper">
      {STEPS.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <span className="step-sep" />}
          <button
            className="step"
            data-active={current === i ? "" : undefined}
            data-done={current > i ? "" : undefined}
            onClick={() => onStepClick(i)}
            type="button"
          >
            <span className="step-num">
              {current > i ? <Icon name="check" size={11} /> : String(i + 1).padStart(2, "0")}
            </span>
            <span className="step-jp">{s.label}</span>
            <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>
              {s.lat}
            </span>
          </button>
        </Fragment>
      ))}
    </nav>
  );
}
