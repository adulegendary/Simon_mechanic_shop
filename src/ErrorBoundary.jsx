import React from "react";

function DebugInfo() {
  const placeId = (import.meta.env.VITE_GOOGLE_PLACE_ID || "").trim();
  const apiKey  = (import.meta.env.VITE_GOOGLE_API_KEY  || "").trim();

  const rows = [
    ["URL",            window.location.href],
    ["User Agent",     navigator.userAgent],
    ["Is Mobile",      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "YES" : "NO"],
    ["Place ID set",   placeId ? `YES (${placeId.slice(0, 8)}…)` : "NO — VITE_GOOGLE_PLACE_ID is empty"],
    ["API Key set",    apiKey  ? "YES"                            : "NO — VITE_GOOGLE_API_KEY is empty"],
    ["Screen",         `${window.screen.width}×${window.screen.height}`],
    ["Viewport",       `${window.innerWidth}×${window.innerHeight}`],
    ["Time",           new Date().toISOString()],
  ];

  return (
    <table style={styles.table}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={styles.tdLabel}>{label}</td>
            <td style={styles.tdValue}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("[ErrorBoundary]", error, info);
  }

  handleCopy() {
    const { error, info } = this.state;
    const text = [
      "=== ERROR ===",
      String(error),
      "",
      "=== COMPONENT STACK ===",
      info?.componentStack || "(none)",
      "",
      "=== DEBUG INFO ===",
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Place ID set: ${(import.meta.env.VITE_GOOGLE_PLACE_ID || "").trim() ? "YES" : "NO"}`,
      `API Key set: ${(import.meta.env.VITE_GOOGLE_API_KEY  || "").trim() ? "YES" : "NO"}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n");
    navigator.clipboard?.writeText(text).then(() => alert("Copied to clipboard!"));
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={styles.wrapper}>
        <div style={styles.box}>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.subtitle}>
            The app crashed. Share the details below to identify the problem.
          </p>

          <h2 style={styles.sectionHead}>Error</h2>
          <pre style={styles.pre}>{String(error)}</pre>

          {info?.componentStack && (
            <>
              <h2 style={styles.sectionHead}>Component Stack</h2>
              <pre style={styles.pre}>{info.componentStack}</pre>
            </>
          )}

          <h2 style={styles.sectionHead}>Debug Info</h2>
          <DebugInfo />

          <div style={styles.actions}>
            <button style={styles.btnPrimary} onClick={() => window.location.reload()}>
              Reload Page
            </button>
            <button style={styles.btnSecondary} onClick={() => this.handleCopy()}>
              Copy All Details
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#0f1117",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
  },
  box: {
    background: "#1a1d27",
    border: "1px solid #e53e3e",
    borderRadius: "10px",
    padding: "28px 24px",
    maxWidth: "760px",
    width: "100%",
    color: "#eee",
  },
  title: {
    color: "#fc8181",
    fontSize: "1.4rem",
    marginTop: 0,
    marginBottom: "6px",
  },
  subtitle: {
    color: "#a0aec0",
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "0.95rem",
  },
  sectionHead: {
    color: "#90cdf4",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
    marginTop: "20px",
  },
  pre: {
    background: "#0f1117",
    border: "1px solid #2d3748",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "0.78rem",
    color: "#f6ad55",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.82rem",
  },
  tdLabel: {
    color: "#90cdf4",
    padding: "5px 12px 5px 0",
    whiteSpace: "nowrap",
    verticalAlign: "top",
    width: "130px",
  },
  tdValue: {
    color: "#e2e8f0",
    padding: "5px 0",
    wordBreak: "break-all",
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    flexWrap: "wrap",
  },
  btnPrimary: {
    background: "#3182ce",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  btnSecondary: {
    background: "transparent",
    color: "#90cdf4",
    border: "1px solid #4a5568",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
};
