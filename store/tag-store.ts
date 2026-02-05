"use client";

import { create } from "zustand";

interface TagStore {
  tagSearchQuery: string;
  setTagSearchQuery: (tag: string) => void;
  clearTag: () => void;
}

// Zustand store: 태그 선택 상태를 간단하게 관리
export const useTagStore = create<TagStore>((set) => ({
  tagSearchQuery: "",
  setTagSearchQuery: (tag: string) => set({ tagSearchQuery: tag }),
  clearTag: () => set({ tagSearchQuery: "" }),
}));
