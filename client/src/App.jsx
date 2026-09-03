import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { AdminPage } from "./pages/AdminPage";
import { CitizenPage } from "./pages/CitizenPage";
import { LoginPage } from "./pages/LoginPage";

const SESSION_STORAGE_KEY = "civic-voice-session";

function readSession() {
  try {
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return storedSession ? JSON.parse(storedSession) : null;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(readSession);

  function handleLogin(nextSession) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  }

  return (
    <>
const THEME_STORAGE_KEY = "civic-voice-theme";

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <>
      <Header
        user={session?.user}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")}
      />
      {!session && <LoginPage onLogin={handleLogin} />}
      {session?.user.role === "citizen" && <CitizenPage user={session.user} />}
      {session?.user.role === "admin" && <AdminPage user={session.user} />}
    </>
  );
}
