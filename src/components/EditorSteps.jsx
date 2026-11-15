import { Children, isValidElement, useRef, useState } from "react";
import { useApp } from "../context";

/** One step of an editor. Only its label and children are used by EditorSteps. */
export function Step({ children }) {
  return children;
}

/**
 * Shows an editor's steps as tabs (one panel at a time) with a progress line and
 * next/back buttons, instead of one long page.
 */
export default function EditorSteps({ children }) {
  const { t } = useApp();
  const steps = Children.toArray(children).filter((c) => isValidElement(c));
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const ref = useRef(null);
  const i = Math.min(index, steps.length - 1);

  const go = (n) => {
    setIndex(n);
    setVisited((v) => new Set(v).add(n));
    // keep the step tabs in view on small screens
    const top = ref.current?.getBoundingClientRect().top ?? 0;
    if (top < 80 || top > window.innerHeight * 0.6) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="editor-steps" ref={ref}>
      <div className="step-tabs" role="tablist">
        {steps.map((s, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            className={`step-tab${visited.has(n) && n !== i ? " is-done" : ""}`}
            aria-selected={n === i}
            onClick={() => go(n)}
          >
            <span className="step-num">{n + 1}</span>
            <span className="step-label">{s.props.label}</span>
          </button>
        ))}
      </div>
      <div className="step-progress" aria-hidden="true">
        <span style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>
      <section className="panel control-block step-panel" role="tabpanel" aria-label={String(steps[i]?.props.label || "")}>
        {steps[i]}
        <div className="step-nav">
          {i > 0 ? (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => go(i - 1)}>
              {t.stepBack}
            </button>
          ) : (
            <span />
          )}
          {i < steps.length - 1 && (
            <button type="button" className="btn btn-secondary btn-small" onClick={() => go(i + 1)}>
              {t.stepNext}: {steps[i + 1].props.label}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

/** On phones: a bar fixed at the bottom with the main action and a jump to the preview. */
export function MobileActionBar({ label, onClick, disabled }) {
  const { t } = useApp();
  return (
    <div className="mobile-bar">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => document.querySelector(".stage-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      >
        {t.preview}
      </button>
      <button type="button" className="btn btn-primary" onClick={onClick} disabled={disabled}>
        {label}
      </button>
    </div>
  );
}
