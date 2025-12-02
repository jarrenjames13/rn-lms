import { useModuleStore } from "@/store/useModuleStore";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Modules() {
  const { moduleData } = useModuleStore();

  const modules = moduleData;
  console.log("Modules Data:", modules);
  return <SafeAreaView></SafeAreaView>;
}
