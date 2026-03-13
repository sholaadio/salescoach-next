"use client";

import React, { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { PinPad } from "@/components/portals/PinPad";
import { CloserPortal } from "@/components/portals/CloserPortal";
import { TeamLeadPortal } from "@/components/portals/TeamLeadPortal";
import { ManagementPortal } from "@/components/portals/ManagementPortal";
import type { User } from "@/types";

// ── Loading screen ────────────────────────────────────────────────────────

const LoadingScreen = ({ status }: { status: string }) => (
  <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4">
    {/* Animated logo */}
    <div className="relative w-14 h-14">
      <div
        className="absolute inset-0 rounded-2xl animate-pulse-soft"
        style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-text">Shoppyrex SalesCoach</p>
      <p className="text-xs text-text-tertiary mt-1">{status}</p>
    </div>
    {/* Progress dots */}
    <div className="flex gap-1.5 mt-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  </div>
);

// ── Error screen ──────────────────────────────────────────────────────────

const ErrorScreen = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-6 p-6">
    <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}>
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div className="text-center">
      <p className="text-base font-semibold text-text">Connection failed</p>
      <p className="text-sm text-text-secondary mt-1">{message}</p>
    </div>
    <button onClick={onRetry} className="btn btn-primary btn-md">
      Retry
    </button>
  </div>
);

// ── AppShell ──────────────────────────────────────────────────────────────

export const AppShell = () => {
  const {
    users, teams, allReports, allLogs, allNoAnswers, goals,
    currentUser, setCurrentUser,
    saveUsersData, refresh,
    isLoading, loadError,
  } = useAppData();

  const [retryKey, setRetryKey] = useState(0);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    await refresh();
  };

  const handleLogout = () => setCurrentUser(null);

  // Loading state
  if (isLoading) {
    return <LoadingScreen status="Connecting to server..." />;
  }

  // Error state
  if (loadError) {
    return (
      <ErrorScreen
        message={loadError}
        onRetry={() => setRetryKey(k => k + 1)}
      />
    );
  }

  // Auth gate — show PIN pad
  if (!currentUser) {
    return (
      <PinPad
        users={users}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  // Shared portal props
  const portalProps = {
    user: currentUser,
    users,
    teams,
    allReports,
    allLogs,
    allNoAnswers,
    goals,
    onLogout: handleLogout,
    refresh,
    saveUsersData,
  };

  // Role-based portal routing
  switch (currentUser.role) {
    case "closer":
      return <CloserPortal {...portalProps} />;

    case "teamlead":
      return <TeamLeadPortal {...portalProps} />;

    default:
      // ceo, gm, head_sales, head_creative, hr
      return <ManagementPortal {...portalProps} />;
  }
};
