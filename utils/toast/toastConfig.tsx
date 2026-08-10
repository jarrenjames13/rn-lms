import { useAppTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { BaseToast, BaseToastProps } from "react-native-toast-message";

export function useToastConfig() {
  const { theme } = useAppTheme();
  const toastStyle = {
    borderLeftColor: theme.text,
    backgroundColor: theme.surface,
    height: "auto" as const,
    minHeight: 70,
    paddingVertical: 10,
    zIndex: 9999,
    elevation: 9999,
  };
  const contentContainerStyle = { paddingHorizontal: 15 };
  const text1Style = { fontSize: 16, fontWeight: "600" as const, color: theme.text };
  const text2Style = { fontSize: 14, color: theme.textMuted };

  return {
    success: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={toastStyle}
            contentContainerStyle={contentContainerStyle}
            renderLeadingIcon={() => (
                <View style={{ position: "relative", zIndex: 9999 }} className="justify-center items-center pl-4">
                    <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                </View>
            )}
            text1Style={text1Style}
            text2Style={text2Style}
        />
    ),
    error: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={toastStyle}
            contentContainerStyle={contentContainerStyle}
            renderLeadingIcon={() => (
                <View style={{ position: "relative", zIndex: 9999 }} className="justify-center items-center pl-4">
                    <Ionicons name="alert-circle" size={24} color={theme.danger} />
                </View>
            )}
            text1Style={text1Style}
            text2Style={text2Style}
        />
    ),
    info: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={toastStyle}
            contentContainerStyle={contentContainerStyle}
            renderLeadingIcon={() => (
                <View style={{ position: "relative", zIndex: 9999 }} className="justify-center items-center pl-4">
                    <Ionicons name="information-circle" size={24} color={theme.warning} />
                </View>
            )}
            text1Style={text1Style}
            text2Style={text2Style}
        />
    ),
  } as const;
}
