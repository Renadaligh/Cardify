import { useApp } from "../context";

/** Text box with a character limit and a live counter. */
export default function LimitedTextarea({ value, onChange, max, placeholder, id, rows = 3 }) {
  const { t } = useApp();
  const near = value.length >= max * 0.9;
  return (
    <div className="limited">
      <textarea
        id={id}
        className="textarea"
        rows={rows}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
      />
      <p className={`hint counter${near ? " counter-near" : ""}`} aria-live="polite">
        {t.charCount(value.length, max)}
      </p>
    </div>
  );
}
