import { useMemo, useRef, useState, useEffect } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import MouseGradientBackground from "./components/MouseGradientBackground";
import TemplatePicker from "./components/TemplatePicker";
import NameInput from "./components/NameInput";
import CardPreview from "./components/CardPreview";
import DownloadButton from "./components/DownloadButton";
import { templates as templatesData } from "./data/templates";
import { translations } from "./data/translations";
import Footer from "./components/Footer";

export default function App() {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("t1");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("lang") || "ar";
  });
  const [showNameError, setShowNameError] = useState(false);

  const previewRef = useRef(null);
  const generatorRef = useRef(null);
  const exportRef = useRef(null);

  const templates = useMemo(() => templatesData, []);
  const selectedTemplate = templates.find((template) => template.id === templateId);
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const textColor = darkMode ? "#f8fafc" : "#0f172a";
  const panelBg = darkMode
    ? "rgba(15, 23, 42, 0.68)"
    : "rgba(255, 255, 255, 0.75)";
  const panelBorder = darkMode
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid rgba(15,23,42,0.08)";
  const boxShadow = darkMode
    ? "0 20px 60px rgba(0,0,0,0.28)"
    : "0 20px 60px rgba(15,23,42,0.08)";

  return (
    <div
      style={{
        color: textColor,
        position: "relative",
        minHeight: "100vh",
      }}
    >
      <MouseGradientBackground darkMode={darkMode} />

      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <HeroSection
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          lang={lang}
          setLang={setLang}
          t={t}
          onStart={scrollToGenerator}
        />

        <section
          ref={generatorRef}
          style={{
            width: "100%",
            padding: "32px 16px 72px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1280px",
              margin: "0 auto",
            }}
          >
            <Header t={t} darkMode={darkMode} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  background: panelBg,
                  border: panelBorder,
                  borderRadius: 20,
                  padding: 16,
                  backdropFilter: "blur(16px)",
                  boxShadow,
                  width: "100%",
                }}
              >
                <TemplatePicker
                  templates={templates}
                  value={templateId}
                  onChange={setTemplateId}
                  t={t}
                />

                <NameInput
                  value={name}
                  onChange={(value) => {
                    setName(value);
                    if (value.trim() !== "") {
                      setShowNameError(false);
                    }
                  }}
                  t={t}
                />

                <DownloadButton
                  targetRef={exportRef}
                  filename={`card-${name || "name"}.png`}
                  name={name}
                  t={t}
                  onEmptyName={() => setShowNameError(true)}
                />
                
              </div>

              <div
                style={{
                  background: panelBg,
                  border: panelBorder,
                  borderRadius: 20,
                  padding: 16,
                  backdropFilter: "blur(16px)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  boxShadow,
                  width: "100%",
                  overflow: "hidden",
                }}
                >
                <CardPreview
                  ref={previewRef}
                  template={selectedTemplate}
                  name={name}
                  t={t}
                />

                <div
                  style={{
                    position: "fixed",
                    left: "-99999px",
                    top: 0,
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                 >
                  <CardPreview
                    ref={exportRef}
                    template={selectedTemplate}
                    name={name}
                    t={t}
                    exportMode={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showNameError && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.box}>
            <h3 style={modalStyles.title}>
              {lang === "ar" ? "الاسم مطلوب" : "Name Required"}
            </h3>

            <p style={modalStyles.text}>
              {lang === "ar"
                ? "من فضلك اكتب الاسم أولًا قبل تحميل البطاقة."
                : "Please enter your name before downloading the card."}
            </p>

            <button
              onClick={() => setShowNameError(false)}
              style={modalStyles.button}
            >
              {lang === "ar" ? "حسنًا" : "OK"}
            </button>
          </div>
        </div>
      )}

      <Footer lang={lang} />
      
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
  },

  box: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },

  title: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#111827",
  },

  text: {
    marginTop: "12px",
    marginBottom: "20px",
    color: "#4b5563",
    lineHeight: 1.7,
    fontSize: "0.98rem",
  },

  button: {
    padding: "10px 20px",
    borderRadius: "999px",
    border: "none",
    background: "#800ed2",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};