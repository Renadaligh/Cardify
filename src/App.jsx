import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "./context";
import { navigate, useRoute } from "./lib/router";
import { translations } from "./data/translations";
import { DEFAULT_THEME, getOccasion, kindOf } from "./data/occasions";
import Background from "./components/Background";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import InviteEditor from "./pages/InviteEditor";
import Certificates from "./pages/Certificates";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Verify from "./pages/Verify";
import MediaPage from "./pages/MediaPage";
import AuthModal from "./components/AuthModal";
import { api, isDemo } from "./lib/api";

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
  // Which section the home list shows: greetings, announcements or invitations.
  const [homeSection, setHomeSection] = useState("greetings");
  const [scrollRequest, setScrollRequest] = useState(0);
  const showSection = useCallback((section) => {
    if (section === "certificates") return navigate("/certificates");
    setHomeSection(section);
    setOccasionFilter("all");
    if (window.location.hash.replace(/^#/, "") && window.location.hash !== "#/") navigate("/");
    setScrollRequest(Date.now());
  }, []);
  const toastTimer = useRef(null);

  // Account: undefined = still checking, null = signed out.
  const [user, setUser] = useState(undefined);
  const [demo, setDemo] = useState(false);
  const [auth, setAuth] = useState(null); // { mode, reason, resolve }
  const refreshUser = useCallback(async () => {
    try {
      const data = await api("GET", "/api/me");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);
  useEffect(() => {
    refreshUser();
    isDemo().then(setDemo);
  }, [refreshUser]);
  /** Opens the sign-in dialog; resolves with the user, or null if closed. */
  const openAuth = useCallback(
    (mode = "signup", reason = "") => new Promise((resolve) => setAuth({ mode, reason, resolve })),
    []
  );
  const signOut = useCallback(async () => {
    await api("POST", "/api/auth/logout", {}).catch(() => {});
    setUser(null);
    navigate("/");
  }, []);

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
    if (["certificates", "account", "admin", "verify"].includes(route.page)) return CERT_THEME;
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
    homeSection,
    setHomeSection,
    scrollRequest,
    showSection,
    user,
    setUser,
    refreshUser,
    openAuth,
    signOut,
    demo,
  };

  const occasion = route.page === "editor" ? getOccasion(route.occasionId) : null;
  // Header highlight: the section of the page being shown.
  const currentSection =
    route.page === "certificates"
      ? "certificates"
      : occasion
        ? { greeting: "greetings", announcement: "announcements", invitation: "invitations" }[kindOf(occasion)]
        : null;

  return (
    <AppContext.Provider value={context}>
      <div className="app">
        <Background colors={theme.blobs} />
        <div className="app-content">
          <TopBar current={route.page === "editor" ? route.occasionId : route.page} section={currentSection} />
          {demo && ["certificates", "account", "admin"].includes(route.page) && (
            <div className="container demo-banner" role="note">
              {t.demoBanner}
            </div>
          )}
          {route.page === "home" && <Home />}
          {route.page === "editor" &&
            (kindOf(occasion) === "invitation" ? (
              <InviteEditor key={route.occasionId} occasionId={route.occasionId} />
            ) : (
              <Editor key={route.occasionId} occasionId={route.occasionId} />
            ))}
          {route.page === "certificates" && <Certificates />}
          {route.page === "account" && <Account query={route.query} />}
          {route.page === "admin" && <Admin />}
          {route.page === "verify" && <Verify serial={route.serial} />}
          {route.page === "media" && <MediaPage id={route.mediaId} />}
        </div>
        <Footer />
        {auth && (
          <AuthModal
            initialMode={auth.mode}
            reason={auth.reason}
            onDone={(u) => {
              setUser(u);
              auth.resolve(u);
              setAuth(null);
              toast(t.authWelcome);
            }}
            onClose={() => {
              auth.resolve(null);
              setAuth(null);
            }}
          />
        )}
        {toastMsg && (
          <div className="toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
