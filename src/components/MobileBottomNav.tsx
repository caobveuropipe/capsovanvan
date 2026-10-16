// Lucian UX/UI Prompt #041 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#041
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Archive,
  BarChart3,
  Plus,
  Settings,
  HardDrive,
  RefreshCw,
} from "lucide-react";

interface MobileBottomNavProps {
  currentTab: "archive" | "stats";
  activeModal?: "intake" | "config" | "drive" | "detail" | "print" | null;
  onTabChange: (tab: "archive" | "stats") => void;
  onOpenIntake: () => void;
  onOpenConfig?: () => void;
  onOpenSettingsMenu: () => void;
  isSettingsOpen?: boolean;
  onOpenGoogleDrive?: () => void;
  onSyncDrive?: () => void;
  onRenewDrive?: () => void;
  isDriveConnected?: boolean;
  isDriveTokenExpired?: boolean;
  isSyncing?: boolean;
  totalDocsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  activeModal,
  onTabChange,
  onOpenIntake,
  onOpenConfig,
  onOpenSettingsMenu,
  isSettingsOpen = false,
  onOpenGoogleDrive,
  onSyncDrive,
  onRenewDrive,
  isDriveConnected = false,
  isDriveTokenExpired = false,
  isSyncing = false,
  totalDocsCount,
}) => {
  // Determine active tab index
  const activeIndex = useMemo(() => {
    if (activeModal === "intake") return 2;
    if (activeModal === "drive") return 3;
    if (isSettingsOpen || activeModal === "config") return 4;
    if (currentTab === "stats") return 1;
    return 0;
  }, [activeModal, isSettingsOpen, currentTab]);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Spring physics motion state
  const motionRef = useRef({
    x: 0,
    v: 0,
    target: 0,
    raf: 0,
  });

  const getCenter = useCallback((btn: HTMLElement | null) => {
    if (!btn || !btn.parentElement) return 0;
    return btn.parentElement.offsetLeft + btn.offsetWidth / 2;
  }, []);

  const step = useCallback(() => {
    const m = motionRef.current;
    const a = (m.target - m.x) * 0.16 - m.v * 0.42;
    m.v += a;
    m.x += m.v;

    if (containerRef.current) {
      containerRef.current.style.setProperty("--x", m.x.toFixed(2) + "px");
    }

    if (Math.abs(m.target - m.x) > 0.3 || Math.abs(m.v) > 0.3) {
      m.raf = requestAnimationFrame(step);
    } else {
      m.x = m.target;
      m.v = 0;
      if (containerRef.current) {
        containerRef.current.style.setProperty("--x", m.x + "px");
      }
      m.raf = 0;
    }
  }, []);

  const moveNotch = useCallback(
    (index: number) => {
      const btn = tabsRef.current[index];
      if (!btn) return;
      const targetPos = getCenter(btn);
      const rm =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const m = motionRef.current;
      m.target = targetPos;

      if (rm) {
        m.x = targetPos;
        m.v = 0;
        if (containerRef.current) {
          containerRef.current.style.setProperty("--x", targetPos + "px");
        }
        return;
      }

      if (!m.raf) {
        m.raf = requestAnimationFrame(step);
      }
    },
    [getCenter, step]
  );

  // Sync notch position on active tab change or window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      moveNotch(activeIndex);
    }, 50);

    const handleResize = () => {
      moveNotch(activeIndex);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      if (motionRef.current.raf) {
        cancelAnimationFrame(motionRef.current.raf);
      }
    };
  }, [activeIndex, moveNotch]);

  // Tab action trigger
  const handleSelectTab = (index: number, focus = false) => {
    if (focus && tabsRef.current[index]) {
      tabsRef.current[index]?.focus();
    }

    switch (index) {
      case 0:
        onTabChange("archive");
        break;
      case 1:
        onTabChange("stats");
        break;
      case 2:
        onOpenIntake();
        break;
      case 3:
        if (isDriveConnected && onSyncDrive) {
          onSyncDrive();
        } else if (onOpenGoogleDrive) {
          onOpenGoogleDrive();
        }
        break;
      case 4:
        onOpenSettingsMenu();
        break;
    }
  };

  // Keyboard navigation with Arrow keys
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (delta !== 0) {
      e.preventDefault();
      const nextIndex = (index + delta + 5) % 5;
      handleSelectTab(nextIndex, true);
    }
  };

  // Ẩn thanh bottom nav khi có bất kỳ modal chức năng nào đang mở
  // để giải phóng 100% diện tích màn hình di động và không che đè nút bấm hành động của modal
  if (activeModal) {
    return null;
  }

  return (
    <>
      <style>{`
        .u041-scope {
          --ux-page: #f8fafc;
          --ux-surface: #ffffff;
          --ux-surface-2: #f1f5f9;
          --ux-surface-3: #e2e8f0;
          --ux-ink: #0f172a;
          --ux-ink-2: #475569;
          --ux-ink-3: #64748b;
          --ux-line: rgba(226, 232, 240, 0.9);
          --ux-line-2: rgba(203, 213, 225, 0.8);
          --ux-accent: #2563eb;
          --ux-accent-2: #3b82f6;
          --ux-accent-soft: rgba(37, 99, 235, 0.12);
          --ux-accent-ink: #ffffff;
          --ux-mint: #10b981;
          --ux-warn: #f59e0b;
          --ux-danger: #ef4444;
          --ux-shadow: rgba(15, 23, 42, 0.08);
          --ux-shadow-strong: rgba(15, 23, 42, 0.12);
          --ux-grad: linear-gradient(135deg, #2563eb, #4f46e5 50%, #06b6d4);
          --ux-ease: cubic-bezier(.2, .8, .2, 1);
          --ux-spring: cubic-bezier(.34, 1.45, .64, 1);
        }

        .u041 {
          --x: 35px;
          position: relative;
          width: 100%;
          max-width: 440px;
          height: 94px;
          display: flex;
          align-items: flex-end;
          margin: 0 auto;
        }

        .u041-bar {
          position: relative;
          width: 100%;
          height: 70px;
          border-radius: 26px 26px 0 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          -webkit-mask: radial-gradient(circle 38px at var(--x) -4px, transparent 96%, #000 100%);
          mask: radial-gradient(circle 38px at var(--x) -4px, transparent 96%, #000 100%);
          box-shadow: 0 -4px 20px -2px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.9);
        }

        .u041-shadow {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 70px;
          border-radius: 26px 26px 0 0;
          box-shadow: 0 -8px 25px -4px rgba(15, 23, 42, 0.09);
          pointer-events: none;
        }

        .u041-bub {
          position: absolute;
          left: var(--x);
          top: calc(100% - 70px - 24px);
          width: 52px;
          height: 52px;
          margin-left: -26px;
          border-radius: 50%;
          background: var(--ux-grad);
          box-shadow: 0 10px 20px -6px rgba(37, 99, 235, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.95);
          pointer-events: none;
          z-index: 2;
        }

        .u041-tabs {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 70px;
          display: flex;
          margin: 0;
          padding: 0 8px;
          list-style: none;
          z-index: 3;
        }

        .u041-tabs > li {
          flex: 1;
          display: flex;
        }

        .u041-tab {
          position: relative;
          flex: 1;
          height: 100%;
          border: 0;
          padding: 0;
          background: none;
          color: var(--ux-ink-3);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .u041-tab:hover .u041-ic {
          color: var(--ux-ink);
        }

        .u041-tab:focus-visible {
          outline: 2px solid var(--ux-accent);
          outline-offset: -6px;
          border-radius: 18px;
        }

        .u041-ic {
          position: absolute;
          left: 50%;
          top: 16px;
          width: 24px;
          height: 24px;
          margin-left: -12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .55s var(--ux-spring), color .3s;
        }

        .u041-ic svg {
          width: 100%;
          height: 100%;
        }

        .u041-lab {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          color: #1d4ed8;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity .3s, transform .45s var(--ux-spring);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 2px;
        }

        .u041-tab[aria-selected="true"] .u041-ic {
          transform: translateY(-28px);
          color: #ffffff;
        }

        .u041-tab[aria-selected="true"] .u041-lab {
          opacity: 1;
          transform: none;
        }

        .u041-bd {
          position: absolute;
          left: calc(50% + 4px);
          top: 8px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 9px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          line-height: 17px;
          font-style: normal;
          box-shadow: 0 0 0 2px #ffffff;
          transition: transform .45s var(--ux-spring), opacity .3s;
          pointer-events: none;
        }

        .u041-tab[aria-selected="true"] .u041-bd {
          transform: scale(0);
          opacity: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .u041-ic, .u041-lab, .u041-bd {
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      <nav
        id="mobile-bottom-navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 print:hidden pb-safe flex justify-center pointer-events-none"
        aria-label="Thanh điều hướng di động"
      >
        <div ref={containerRef} className="u041-scope u041 pointer-events-auto">
          {/* Elevation Shadow */}
          <span className="u041-shadow" aria-hidden="true" />

          {/* Notched Bar Surface */}
          <div className="u041-bar" aria-hidden="true" />

          {/* Floating Bubble Highlight */}
          <span className="u041-bub" aria-hidden="true" />

          {/* Tabs List */}
          <ul className="u041-tabs" role="tablist" aria-label="Bottom navigation">
            {/* 1. Kho lưu trữ */}
            <li role="none">
              <button
                ref={(el) => (tabsRef.current[0] = el)}
                id="mobile-nav-archive"
                className="u041-tab"
                type="button"
                role="tab"
                aria-selected={activeIndex === 0}
                tabIndex={activeIndex === 0 ? 0 : -1}
                onClick={() => handleSelectTab(0)}
                onKeyDown={(e) => handleKeyDown(e, 0)}
              >
                <span className="u041-ic" aria-hidden="true">
                  <Archive />
                </span>
                {totalDocsCount > 0 && (
                  <em className="u041-bd" aria-label={`${totalDocsCount} văn bản`}>
                    {totalDocsCount > 99 ? "99+" : totalDocsCount}
                  </em>
                )}
                <span className="u041-lab">Lưu trữ</span>
              </button>
            </li>

            {/* 2. Thống kê */}
            <li role="none">
              <button
                ref={(el) => (tabsRef.current[1] = el)}
                id="mobile-nav-stats"
                className="u041-tab"
                type="button"
                role="tab"
                aria-selected={activeIndex === 1}
                tabIndex={activeIndex === 1 ? 0 : -1}
                onClick={() => handleSelectTab(1)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
              >
                <span className="u041-ic" aria-hidden="true">
                  <BarChart3 />
                </span>
                <span className="u041-lab">Thống kê</span>
              </button>
            </li>

            {/* 3. Cấp số (Trung tâm) */}
            <li role="none">
              <button
                ref={(el) => (tabsRef.current[2] = el)}
                id="mobile-nav-intake-btn"
                className="u041-tab"
                type="button"
                role="tab"
                aria-selected={activeIndex === 2}
                tabIndex={activeIndex === 2 ? 0 : -1}
                onClick={() => handleSelectTab(2)}
                onKeyDown={(e) => handleKeyDown(e, 2)}
              >
                <span className="u041-ic" aria-hidden="true">
                  <Plus className="stroke-[2.5]" />
                </span>
                <span className="u041-lab">Cấp số</span>
              </button>
            </li>

            {/* 4. Google Drive */}
            <li role="none">
              <button
                ref={(el) => (tabsRef.current[3] = el)}
                id="mobile-nav-drive"
                className="u041-tab"
                type="button"
                role="tab"
                aria-selected={activeIndex === 3}
                tabIndex={activeIndex === 3 ? 0 : -1}
                onClick={() => handleSelectTab(3)}
                onKeyDown={(e) => handleKeyDown(e, 3)}
              >
                <span className="u041-ic" aria-hidden="true">
                  {isSyncing ? (
                    <RefreshCw className="animate-spin text-blue-400" />
                  ) : (
                    <HardDrive />
                  )}
                </span>
                {isDriveConnected && (
                  <span
                    className={`absolute top-2.5 right-3 w-2 h-2 rounded-full border-2 border-white ${
                      isSyncing ? "bg-blue-500 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                )}
                <span className="u041-lab">
                  {isSyncing ? "Đang đồng bộ" : isDriveConnected ? "Đồng bộ" : "Drive"}
                </span>
              </button>
            </li>

            {/* 5. Cài đặt */}
            <li role="none">
              <button
                ref={(el) => (tabsRef.current[4] = el)}
                id="mobile-nav-settings"
                className="u041-tab"
                type="button"
                role="tab"
                aria-selected={activeIndex === 4}
                tabIndex={activeIndex === 4 ? 0 : -1}
                onClick={() => handleSelectTab(4)}
                onKeyDown={(e) => handleKeyDown(e, 4)}
              >
                <span className="u041-ic" aria-hidden="true">
                  <Settings />
                </span>
                {isDriveConnected && (
                  <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />
                )}
                <span className="u041-lab">Cài đặt</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};
