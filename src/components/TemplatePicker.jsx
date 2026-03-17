export default function TemplatePicker({ templates, value, onChange, t }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={label}>{t.template}</label>
      <select
        style={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
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