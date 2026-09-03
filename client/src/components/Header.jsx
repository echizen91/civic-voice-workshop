export function Header({ user, onLogout, theme, onToggleTheme }) {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        <span className="brand-mark">C</span>
        <span>CivicVoice</span>
      </a>
      <div className="header-actions">
        <button className="text-button" type="button" onClick={onToggleTheme}>Use {theme === "dark" ? "light" : "dark"} mode</button>
        {user && <span className="signed-in">Signed in as {user.name}</span>}
        {user && <button className="text-button" onClick={onLogout}>Sign out</button>}
      </div>
    </header>
  );
}
