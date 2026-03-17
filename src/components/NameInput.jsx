export default function NameInput({ value, onChange, t }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={label}>{t.name}</label>
      <input
        style={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder= {t.namePlaceholder}
      />
    </div>
  );
}

const label = {
  display: "block",
  marginBottom: 6,
  fontWeight: 700,
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};