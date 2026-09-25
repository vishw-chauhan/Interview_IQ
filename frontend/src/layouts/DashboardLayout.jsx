import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Video,
  BarChart3,
  Target,
  History,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './DashboardLayout.css';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, available: true },
  { label: 'Resume Analysis', icon: FileText, available: false, phase: 'Phase 5' },
  { label: 'AI Interview', icon: Video, available: false, phase: 'Phase 9' },
  { label: 'Performance Report', icon: BarChart3, available: false, phase: 'Phase 15' },
  { label: 'Skill Analysis', icon: Target, available: false, phase: 'Phase 17' },
  { label: 'Interview History', icon: History, available: false, phase: 'Phase 18' },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the user menu when clicking outside it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close the mobile sidebar whenever the route changes (a nav link was clicked)
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="shell">
      {isSidebarOpen && (
        <button
          className="shell__overlay"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      )}

      <aside className={`shell__sidebar ${isSidebarOpen ? 'shell__sidebar--open' : ''}`}>
        <div className="shell__brand">
          <span className="shell__logo" aria-hidden="true">IQ</span>
          <span className="shell__brand-name">InterviewIQ</span>
          <button
            className="shell__close-btn"
            aria-label="Close menu"
            onClick={closeSidebar}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="shell__nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (!item.available) {
              return (
                <div key={item.label} className="shell__nav-item shell__nav-item--disabled">
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                  <span className="shell__nav-badge">{item.phase}</span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `shell__nav-item ${isActive ? 'shell__nav-item--active' : ''}`
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="shell__main">
        <header className="shell__topbar">
          <button
            className="shell__menu-btn"
            aria-label="Open menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="shell__topbar-spacer" />

          <div className="shell__user" ref={menuRef}>
            <button
              className="shell__user-btn"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <span className="shell__avatar">{getInitials(user?.name)}</span>
              <span className="shell__user-name">{user?.name?.split(' ')[0] || 'Account'}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div className="shell__user-menu" role="menu">
                <div className="shell__user-menu-info">
                  <p className="shell__user-menu-name">{user?.name}</p>
                  <p className="shell__user-menu-email">{user?.email}</p>
                </div>
                <button className="shell__user-menu-item" role="menuitem" onClick={logout}>
                  <LogOut size={16} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}