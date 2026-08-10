import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme";

export function AppScreen({ children, style }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { theme } = useAppTheme();
  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.canvas }, style]}>{children}</SafeAreaView>;
}

export function Card({ children, style }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { theme } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.text }, style]}>{children}</View>;
}

export function AppButton({ label, onPress, loading, disabled, variant = "primary", accessibilityLabel }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: "primary" | "secondary" | "danger"; accessibilityLabel?: string }) {
  const { theme } = useAppTheme();
  const backgroundColor = variant === "danger" ? theme.danger : variant === "secondary" ? theme.surfaceMuted : theme.primary;
  const labelColor = variant === "secondary" ? theme.primary : "#FFFFFF";
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor }, (disabled || loading) && styles.disabled, pressed && !disabled && styles.pressed]}>{loading ? <ActivityIndicator color={labelColor} /> : <Text style={[styles.buttonLabel, { color: labelColor }]}>{label}</Text>}</Pressable>;
}

export function IconButton({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.iconButton, { borderColor: theme.border }]}><Ionicons name={icon} size={20} color={theme.text} /></Pressable>;
}

export function AppHeader({ title, eyebrow, subtitle, action }: { title: string; eyebrow?: string; subtitle?: string; action?: React.ReactNode }) {
  const { theme } = useAppTheme();
  return <View style={styles.header}><View style={styles.headerCopy}>{eyebrow ? <Text style={[styles.eyebrow, { color: theme.school }]}>{eyebrow}</Text> : null}<Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>{subtitle ? <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}</View>{action}</View>;
}

export function StateView({ icon, title, message, actionLabel, onAction }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useAppTheme();
  return <View accessibilityRole="alert" style={styles.state}><View style={[styles.stateIcon, { backgroundColor: theme.surfaceMuted }]}><Ionicons name={icon} size={30} color={theme.primary} /></View><Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text><Text style={[styles.stateMessage, { color: theme.textMuted }]}>{message}</Text>{actionLabel && onAction ? <View style={styles.stateAction}><AppButton label={actionLabel} onPress={onAction} /></View> : null}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, card: { borderWidth: 1, borderRadius: 20, padding: 16, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  button: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, buttonLabel: { fontSize: 15, fontWeight: "700" }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.82 }, iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", gap: 16, alignItems: "center", paddingBottom: 20 }, headerCopy: { flex: 1 }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginBottom: 3 }, headerTitle: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 }, headerSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 }, state: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }, stateIcon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center" }, stateTitle: { fontSize: 20, fontWeight: "800", marginTop: 18 }, stateMessage: { fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6 }, stateAction: { marginTop: 20, minWidth: 150 },
});
