export default function Header({ t, darkMode }) {
  return (
    <header style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0 }}>{t.generatorTitle}</h2>
      <p
        style={{
          marginTop: 6,
          color: darkMode ? "#cbd5e1" : "#64748b",
        }}
      >
        {t.generatorSubtitle}
      </p>
    </header>
  );
}