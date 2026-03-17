export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <p>Made by Renad Alghamdi © {year}</p>
    </footer>
  );
}

const styles = {
  footer: {
    textAlign: "center",
    padding: "30px 20px",
    fontSize: "0.9rem",
    opacity: 0.8,
    fontFamily: "inherit",
  },
};