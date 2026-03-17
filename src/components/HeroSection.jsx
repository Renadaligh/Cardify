import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import "../styles/logo.css";

export default function HeroSection({
  darkMode,
  setDarkMode,
  lang,
  setLang,
  t,
  onStart,
}) {
  const isArabic = lang === "ar";

  return (
    <section style={styles.section}>
      <div
        style={{
          ...styles.topBar,
          flexDirection: isArabic ? "row-reverse" : "row",
        }}
      >
        <img
            className="hero-logo"
            src={darkMode ? `${import.meta.env.BASE_URL}logos/Mylogo.png` : `${import.meta.env.BASE_URL}logos/Mylogo2.png` }
            alt="Logo"
     />

        <div style={styles.actions}>
          <LanguageToggle lang={lang} setLang={setLang} t={t} darkMode={darkMode} />
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
        </div>
      </div>

      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.title}>{t.heroTitle}</h1>
          <p style={styles.subtitle}>{t.heroSubtitle}</p>

          <button onClick={onStart} style={styles.startBtn}>
            {t.start}
          </button>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    minHeight: "100vh",
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "20px",
    flexWrap: "wrap",
   },
   
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    direction: "ltr",
  },

  center: {
    flex: 1,
    display: "grid",
    placeItems: "center",
    padding: 24,
  },

  card: {
    width: "min(760px, 100%)",
    padding: "34px 24px",
    borderRadius: 28,
    textAlign: "center",
  },

  title: {
    margin: 0,
    fontSize: "clamp(2.4rem, 6vw, 4.8rem)",
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "16px auto 0",
    maxWidth: 620,
    lineHeight: 1.9,
    fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
    opacity: 0.92,
  },

  startBtn: {
    marginTop: 28,
    padding: "14px 28px",
    borderRadius: 999,
    border: "none",
    background: "#800ed2",
    color: "#fff",
    fontWeight: 800,
    fontSize: "1.2rem",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 14px 30px rgba(118, 9, 165, 0.28)",
  },
};