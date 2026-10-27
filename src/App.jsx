import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "./context";
import { navigate, useRoute } from "./lib/router";
import { translations } from "./data/translations";
import { DEFAULT_THEME, getOccasion } from "./data/occasions";
import Background from "./components/Background";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Certificates from "./pages/Certificates";

const CERT_THEME = { accent: "#2563eb", blobs: ["#3b82f6", "#f59e0b", "#14b8a6"] };

function readStorage(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — ignore */
  }
}

export default function App() {
  const route = useRoute();
  const [lang, setLang] = useState(() => readStorage("lang", "ar"));
  const [toastMsg, setToastMsg] = useState(null);
  const [heroTint, setHeroTint] = useState(null);
  // Category filter of the occasions list, shared so the header can open it on a category.
  const [occasionFilter, setOccasionFilter] = useState("all");
  const [scrollRequest, setScrollRequest] = useState(0);
  const showCategory = useCallback((group) => {
    setOccasionFilter(group);
    if (window.location.hash.replace(/^#/, "") && window.location.hash !== "#/") navigate("/");
    setScrollRequest(Date.now());
  }, []);
  const toastTimer = useRef(null);

  const t = translations[lang];

  // The site is designed for night mode only.
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  useEffect(() => {
    writeStorage("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // Each occasion tints the site with its own colours.
  const theme = useMemo(() => {
    if (route.page === "editor") return getOccasion(route.occasionId)?.theme || DEFAULT_THEME;
    if (route.page === "certificates") return CERT_THEME;
    // On the home page the background light follows the sky scene above it.
    return heroTint ? { ...DEFAULT_THEME, blobs: heroTint } : DEFAULT_THEME;
  }, [route.page, route.occasionId, heroTint]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", theme.accent);
  }, [theme]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const context = {
    t,
    lang,
    setLang,
    toast,
    setHeroTint,
    occasionFilter,
    setOccasionFilter,
    scrollRequest,
    showCategory,
  };

  return (
    <AppContext.Provider value={context}>
      <div className="app">
        <Background colors={theme.blobs} />
        <div className="app-content">
          <TopBar current={route.page === "editor" ? route.occasionId : route.page} />
          {route.page === "home" && <Home />}
          {route.page === "editor" && <Editor key={route.occasionId} occasionId={route.occasionId} />}
          {route.page === "certificates" && <Certificates />}
        </div>
        <Footer />
        {toastMsg && (
          <div className="toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
