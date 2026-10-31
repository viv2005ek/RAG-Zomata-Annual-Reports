import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { InfoRail } from './InfoRail';
import { ChatWindow } from '../chat/ChatWindow';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useChatStore } from '../../store/useChatStore';

export function AppShell() {
  const { 
    isSidebarOpen, 
    setSidebarOpen,
    isInfoRailOpen, 
    setInfoRailOpen 
  } = useSettingsStore();

  const initStore = useChatStore((s) => s.initStore);

  // Mouse spotlight coordinates
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  // Initialize store and lock dark mode on mount
  useEffect(() => {
    initStore();
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('etr.theme.v1', 'dark');
  }, [initStore]);

  // Track mouse position for dynamic spotlight effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isInfoRailOpen) setInfoRailOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInfoRailOpen, setInfoRailOpen]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0A0A0C] text-[#FAF9F6] font-sans antialiased selection:bg-amber-500/30 selection:text-white">
      {/* Dynamic Cursor Spotlight Effect in Warm Solar Amber */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.08), rgba(249, 115, 22, 0.04) 40%, transparent 75%)`,
        }}
      />

      {/* Subtle Warm Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-30" />

      {/* Living Ambient Morphing Solar Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Orb 1: Solar Gold & Amber (Top Left) */}
        <div className="absolute -top-32 -left-32 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-amber-500/14 via-yellow-500/10 to-orange-500/08 blur-[130px] animate-orb-1" />

        {/* Orb 2: Sunset Coral & Bronze (Top Right) */}
        <div className="absolute top-1/4 -right-36 w-[560px] h-[560px] rounded-full bg-gradient-to-bl from-orange-500/10 via-amber-500/08 to-yellow-600/06 blur-[140px] animate-orb-2" />

        {/* Orb 3: Deep Gold Flare (Bottom Left/Center) */}
        <div className="absolute -bottom-36 left-1/3 w-[600px] h-[500px] rounded-full bg-gradient-to-t from-amber-600/10 via-orange-600/08 to-transparent blur-[150px] animate-orb-3" />
      </div>

      {/* App Layout: Sidebar | Chat | InfoRail */}
      <div className="relative z-10 flex h-full w-full overflow-hidden backdrop-blur-[2px]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full min-w-0">
          <ChatWindow />
        </main>

        {/* InfoRail Drawer / Sidebar */}
        <InfoRail />
      </div>
    </div>
  );
}
