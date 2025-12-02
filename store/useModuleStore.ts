import { ModuleData } from "@/types/api";
import { create } from "zustand";
type ModuleStore = {
  moduleData: ModuleData | null;
  setModuleData: (data: ModuleData) => void;
};

export const useModuleStore = create<ModuleStore>((set) => ({
  moduleData: null,
  setModuleData: (data: ModuleData) => set({ moduleData: data }),
}));
