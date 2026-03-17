export default function ThemeToggle({ darkMode, setDarkMode, t }) {
  return (
    <button onClick={() => setDarkMode(!darkMode)} style={styles.btn}>
      {darkMode ? 
      <>
      <img src={
          darkMode
            ? `${import.meta.env.BASE_URL}logos/LightMode.png`
            : `${import.meta.env.BASE_URL}logos/DarkMode.png`
        } alt="Light Mode" style={{width: "18px"}}/> 
      {t.light}
      </> : <>
      <img src={`${import.meta.env.BASE_URL}logos/DarkMode.png`} alt="Dark Mode" style={{width: "18px"}}/>
      {t.dark}
      </> }
    </button>
  );
}

const styles = {
  btn: {
    padding: "10px 20px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    color: "inherit",
    cursor: "pointer",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "inherit"
  },
};