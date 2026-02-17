'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, User, LogOut, Shield, Sun, Moon, X, Check, Clock, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

// Mock notifications for now — can be replaced with real API data later
const mockNotifications = [
  { id: 1, type: 'alert', title: '5 agents at risk', message: 'Agents in Delhi region need immediate attention', time: '10 min ago', read: false },
  { id: 2, type: 'info', title: 'Bulk import complete', message: '14 agents imported successfully', time: '1 hour ago', read: false },
  { id: 3, type: 'success', title: 'Training module published', message: '"Product Knowledge Q1" is now live', time: '3 hours ago', read: true },
  { id: 4, type: 'alert', title: 'ADM performance drop', message: 'Rajesh Kumar\'s team score dropped 15%', time: '5 hours ago', read: true },
];

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Refs for click outside
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleThemeToggle = () => {
    // Add transitioning class for smooth animation
    document.documentElement.classList.add('transitioning');
    toggleTheme();
    setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
    }, 400);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success': return <Check className="w-4 h-4 text-emerald-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b border-surface-border/60 sticky top-0 z-30 backdrop-blur-xl"
      style={{ backgroundColor: 'var(--header-bg)' }}
    >
      {/* Left: Page Title area */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">
          ADM Activation <span className="text-brand-red">Platform</span>
        </h1>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-8">
        <div
          className={`relative transition-all duration-200 ${
            searchFocused ? 'scale-105' : ''
          }`}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search agents, ADMs, regions..."
            className="w-full pl-10 pr-4 py-2 input-dark text-sm"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{unreadCount}</span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 animate-fade-in"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--surface-border)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--surface-border)' }}>
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-red hover:text-brand-red-light transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-all text-left border-b last:border-b-0"
                      style={{ borderColor: 'var(--surface-border)', opacity: notif.read ? 0.6 : 1 }}
                    >
                      <div className="mt-0.5 flex-shrink-0">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                          {!notif.read && <span className="w-1.5 h-1.5 bg-brand-red rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500">{notif.time}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: 'var(--surface-border)' }}>
                <button className="text-xs text-brand-red hover:text-brand-red-light transition-colors font-medium">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-50 animate-fade-in"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--surface-border)',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--surface-border)' }}>
                <h3 className="text-sm font-semibold text-white">Settings</h3>
              </div>
              <div className="p-2">
                {/* Theme Toggle Row */}
                <button
                  onClick={handleThemeToggle}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="w-4 h-4 text-gray-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    <span className="text-sm text-gray-300">Appearance</span>
                  </div>
                  <div
                    className="relative w-10 h-5 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: isDark ? '#374151' : '#E31837' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300"
                      style={{ transform: isDark ? 'translateX(2px)' : 'translateX(22px)' }}
                    />
                  </div>
                </button>

                {/* Notification Preferences */}
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Notification Preferences</span>
                </button>

                {/* Profile Settings */}
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Profile Settings</span>
                </button>
              </div>
              <div className="px-4 py-2.5 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                <p className="text-[10px] text-gray-500 text-center">ADM Platform v1.0</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile + Logout */}
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
            {isAdmin ? (
              <Shield className="w-4 h-4 text-white" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-white leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-500 leading-tight capitalize">{user?.role || 'admin'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
