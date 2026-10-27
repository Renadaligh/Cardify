// Small form building blocks shared by the card editor and certificates page.

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="field">
      {label && (htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="field-label">{label}</span>)}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function ColorField({ value, onChange, onReset, resetLabel, id }) {
  return (
    <div className="color-field">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span dir="ltr" style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
        {value.toUpperCase()}
      </span>
      {onReset && (
        <button type="button" className="btn btn-ghost btn-small" onClick={onReset}>
          {resetLabel}
        </button>
      )}
    </div>
  );
}

export function FileButton({ label, accept, onFile, className = "btn btn-secondary btn-small" }) {
  return (
    <label className={`${className} file-button`}>
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function StepTitle({ n, children }) {
  return (
    <h2>
      <span className="step-num">{n}</span>
      {children}
    </h2>
  );
}
