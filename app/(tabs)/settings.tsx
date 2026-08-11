import { AppButton, AppScreen, Card } from "@/components/ui";
import { useAuth } from "@/context/authContext";
import { useAppTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Settings() {
  const { onLogout, authState } = useAuth();
  const { theme, isDark, appearanceMode, setAppearanceMode } = useAppTheme();
  const user = authState?.user;

  if (authState?.isLoading) {
    return <AppScreen style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></AppScreen>;
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.headerMark, { backgroundColor: theme.surfaceAccent }]}><Ionicons name="school-outline" size={24} color={theme.school} /></View>
          <View><Text style={[styles.eyebrow, { color: theme.school }]}>STUDENT ACCOUNT</Text><Text style={[styles.title, { color: theme.text }]}>Settings</Text><Text style={[styles.subtitle, { color: theme.textMuted }]}>Personalize your learning space.</Text></View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PROFILE</Text>
        <Card style={styles.profileCard}>
          {user ? <>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={styles.avatarText}>{user.full_name?.charAt(0).toUpperCase()}</Text></View>
            <Text style={[styles.name, { color: theme.text }]}>{user.full_name}</Text>
            <View style={[styles.role, { backgroundColor: theme.surfaceMuted }]}><Ionicons name="shield-checkmark-outline" size={15} color={theme.primary} /><Text style={[styles.roleText, { color: theme.primary }]}>{user.role}</Text></View>
            <View style={[styles.rule, { backgroundColor: theme.border }]} />
            <Detail icon="person-outline" label="Student ID" value={user.external_id} />
          </> : <Text style={[styles.subtitle, { color: theme.textMuted }]}>Profile details are unavailable.</Text>}
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>APPEARANCE</Text>
        <Card style={styles.appearanceCard}>
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: theme.surfaceMuted }]}><Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={20} color={theme.primary} /></View><View style={styles.rowText}><Text style={[styles.rowTitle, { color: theme.text }]}>Display</Text><Text style={[styles.rowDescription, { color: theme.textMuted }]}>Choose how Aurora LMS looks.</Text></View></View>
          <View style={[styles.segmented, { backgroundColor: theme.canvas, borderColor: theme.border }]}>
            {(["light", "dark", "system"] as const).map((mode) => <Pressable key={mode} accessibilityRole="button" accessibilityLabel={`${mode} appearance`} accessibilityState={{ selected: mode === appearanceMode }} onPress={() => setAppearanceMode(mode)} style={[styles.segment, mode === appearanceMode && { backgroundColor: theme.primary }]}><Text style={[styles.segmentText, { color: mode === appearanceMode ? "#FFFFFF" : theme.textMuted }]}>{mode[0].toUpperCase() + mode.slice(1)}</Text></Pressable>)}
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT</Text>
        <AppButton label="Sign out" variant="danger" onPress={() => onLogout?.() ?? Promise.resolve()} accessibilityLabel="Sign out of Aurora LMS" />
        <Text style={[styles.footer, { color: theme.textMuted }]}>Aurora LMS 1.0.0</Text>
      </ScrollView>
    </AppScreen>
  );
}

function Detail({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.detail}><Ionicons name={icon} size={18} color={theme.textMuted} /><View><Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text><Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" }, content: { padding: 20, paddingBottom: 36 }, header: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, marginBottom: 14 }, headerMark: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center" }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 }, title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { fontSize: 14, marginTop: 3 }, sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 18, marginBottom: 8 }, profileCard: { alignItems: "center" }, avatar: { width: 68, height: 68, borderRadius: 34, justifyContent: "center", alignItems: "center" }, avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" }, name: { fontSize: 20, fontWeight: "800", marginTop: 12 }, role: { flexDirection: "row", gap: 6, alignItems: "center", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 }, roleText: { fontSize: 13, fontWeight: "700", textTransform: "capitalize" }, rule: { height: 1, alignSelf: "stretch", marginVertical: 18 }, detail: { flexDirection: "row", gap: 10, alignSelf: "stretch", alignItems: "center" }, detailLabel: { fontSize: 12, fontWeight: "600" }, detailValue: { fontSize: 15, fontWeight: "700", marginTop: 2 }, appearanceCard: { gap: 16 }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, rowIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center" }, rowText: { flex: 1 }, rowTitle: { fontSize: 16, fontWeight: "800" }, rowDescription: { fontSize: 13, marginTop: 2 }, segmented: { flexDirection: "row", borderWidth: 1, borderRadius: 13, padding: 3 }, segment: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" }, segmentText: { fontSize: 13, fontWeight: "700" }, footer: { textAlign: "center", fontSize: 12, marginTop: 24 },
});
