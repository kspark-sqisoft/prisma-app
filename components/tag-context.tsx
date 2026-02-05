"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface TagContextType {
  tagSearchQuery: string;
  setTagSearchQuery: (tag: string) => void;
  clearTag: () => void;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export function TagProvider({ children }: { children: ReactNode }) {
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const clearTag = () => {
    setTagSearchQuery("");
  };

  return (
    <TagContext.Provider value={{ tagSearchQuery, setTagSearchQuery, clearTag }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTag() {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error("useTag must be used within a TagProvider");
  }
  return context;
}
