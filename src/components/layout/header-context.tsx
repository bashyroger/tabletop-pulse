"use client";

import React, { createContext, useContext, useState } from "react";

interface HeaderState {
  title: string;
  subtitle?: string;
  badge?: string;
}

interface HeaderContextValue {
  header: HeaderState;
  setHeader: (next: HeaderState) => void;
}

const HeaderContext = createContext<HeaderContextValue>({
  header: {
    title: "Club Pulse",
    subtitle: "Board Game Telemetry, ELO Rankings & Social Recaps",
  },
  setHeader: () => {},
});

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<HeaderState>({
    title: "Club Pulse",
    subtitle: "Board Game Telemetry, ELO Rankings & Social Recaps",
  });

  return (
    <HeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeaderContext() {
  return useContext(HeaderContext);
}
