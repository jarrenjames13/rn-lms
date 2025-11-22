import { ToastConfig } from "@/utils/toast/toastConfig";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import Toast from "react-native-toast-message";
import "../global.css";
export default function RootLayout() {
  return (
  <React.Fragment>
    <StatusBar style="auto"/>
    <Stack>
        <Stack.Screen
        name="login"
        options={{
          headerShown: false,

         }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false
        }}
      />


    </Stack>
    <Toast config={ToastConfig} />

  </React.Fragment>
  );
}
