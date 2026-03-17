export default function LanguageToggle({ lang, setLang, t, darkMode }) {
  const icon = darkMode
    ? `${import.meta.env.BASE_URL}logos/LanguageDark.png`
    : `${import.meta.env.BASE_URL}logos/LanguageLight.png`;

  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      style={styles.btn}
    >
      <img src={icon} alt="Language" style={{ width: 18 }} />

      <span>{lang === "ar" ? t.english : t.arabic}</span>
    </button>
  );
}

const styles = {
  btn: {
    padding: "10px 25px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    color: "inherit",
    cursor: "pointer",
    fontWeight: 700,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};