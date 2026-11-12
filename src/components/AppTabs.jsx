import React, { useEffect, useState } from 'react';
import Home from '../pages/Home';
import Production from '../pages/Production';
import Explore from '../pages/Explore';
import History from '../pages/History';

const PAGES = [
  { name: 'Dashboard', short: 'Home', icon: '▦', component: Home },
  { name: 'Production', short: 'Production', icon: '▥', component: Production },
  { name: 'History', short: 'History', icon: '◷', component: History },
  { name: 'Explore', short: 'Explore', icon: '⌘', component: Explore },
];

const THEME_KEY = 'solar-monitor-theme';

export default function AppTabs() {
  const [currentPage, setCurrentPage] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'auto');
  const [menuOpen, setMenuOpen] = useState(false);
  const PageComponent = PAGES[currentPage].component;

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'dark' : 'light';
    };
    applyTheme();
    localStorage.setItem(THEME_KEY, theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', applyTheme);
    return () => media.removeEventListener?.('change', applyTheme);
  }, [theme]);

  const cycleTheme = () => setTheme((value) => value === 'auto' ? 'light' : value === 'light' ? 'dark' : 'auto');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setCurrentPage(0)} aria-label="SolarMonitor dashboard">
          <span className="brand-mark"><span>☀</span><i /></span>
          <span>SolarMonitor</span>
        </button>
        <nav className="side-nav" aria-label="Main navigation">
          {PAGES.map((page, index) => (
            <button key={page.name} className={`nav-item ${currentPage === index ? 'active' : ''}`} onClick={() => setCurrentPage(index)}>
              <span className="nav-icon">{page.icon}</span><span>{page.name}</span>
            </button>
          ))}
          <div className="nav-separator" />
          <button className="nav-item" onClick={cycleTheme}>
            <span className="nav-icon">◐</span><span>Appearance</span>
            <span className="nav-meta">{theme === 'auto' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="footer-art" aria-hidden="true"><div className="sun-disc" /><div className="solar-roof"><span /><span /><span /><span /><span /><span /></div><div className="hill hill-one" /><div className="hill hill-two" /></div>
          <strong>Solar energy monitoring</strong>
          <span>Real-time · Reliable · Simple</span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span>☀</span><i /></span><strong>SolarMonitor</strong></div>
          <div className="topbar-spacer" />
          <button className="icon-button theme-toggle" onClick={cycleTheme} title={`Appearance: ${theme}`} aria-label="Change appearance">◐</button>
          <button className="avatar-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Profile menu">A</button>
          {menuOpen && <div className="profile-menu"><strong>Solar Monitor</strong><span>Inverter monitoring</span><button onClick={() => { setCurrentPage(3); setMenuOpen(false); }}>Manage systems</button></div>}
        </header>
        <main className="page-viewport">
          <PageComponent />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {PAGES.map((page, index) => (
          <button key={page.name} className={`mobile-nav-item ${currentPage === index ? 'active' : ''}`} onClick={() => setCurrentPage(index)}>
            <span>{page.icon}</span><small>{page.short}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
