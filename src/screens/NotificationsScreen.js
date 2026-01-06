import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

function formatRelative(ts) {
  const now = Date.now();
  const diff = Math.max(0, now - ts);

  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} min ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;

  const day = Math.floor(hr / 24);
  return `${day} day ago`;
}

function NotifRow({ icon, iconBg, title, subtitle, rightText, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.row} android_ripple={{ color: "rgba(0,0,0,0.06)" }}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color="#2E3A59" />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>

      <Text style={styles.rowRight}>{rightText}</Text>
    </Pressable>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const items = useMemo(() => {
    const now = Date.now();
    return {
      today: [
        {
          id: "battery-full-1",
          icon: "battery-full",
          iconBg: "#E7F7EE",
          title: "Battery Full",
          subtitle: "Fully charged.",
          ts: now - 5 * 60000,
        },
        {
          id: "device-connected-1",
          icon: "wifi",
          iconBg: "#EAF2FF",
          title: "📡 AquaVolt Device Connected",
          subtitle: "Live data is now available.",
          ts: now - 22 * 60000,
        },
        {
          id: "rain-detected-1",
          icon: "rainy",
          iconBg: "#EAF6FF",
          title: "Rain Detected / System Active",
          subtitle: "Harvesting has started.",
          ts: now - 44 * 60000,
        },
      ],
      yesterday: [
        {
          id: "reservoir-full-1",
          icon: "water",
          iconBg: "#EAF6FF",
          title: "Reservoir Full",
          subtitle: "Tank level reached maximum.",
          ts: now - 1 * 24 * 60 * 60000,
        },
        {
          id: "connectivity-1",
          icon: "bluetooth",
          iconBg: "#EEF2FF",
          title: "Connectivity Notification",
          subtitle: "Bluetooth link is stable.",
          ts: now - 1 * 24 * 60 * 60000 - 3 * 60 * 60000,
        },
      ],
    };
  }, []);

  return (
    <View style={styles.page}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.headerBrand}>AquaVolt</Text>

            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Notifications</Text>

        <Section title="Today">
          {items.today.map((n) => (
            <NotifRow
              key={n.id}
              icon={n.icon}
              iconBg={n.iconBg}
              title={n.title}
              subtitle={n.subtitle}
              rightText={formatRelative(n.ts)}
              onPress={() => {}}
            />
          ))}
        </Section>

        <Section title="Yesterday">
          {items.yesterday.map((n) => (
            <NotifRow
              key={n.id}
              icon={n.icon}
              iconBg={n.iconBg}
              title={n.title}
              subtitle={n.subtitle}
              rightText={formatRelative(n.ts)}
              onPress={() => {}}
            />
          ))}
        </Section>

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#EEF5F9" },

  header: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  headerBrand: { color: "#fff", fontSize: 20, fontWeight: "900" },

  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2E3A59",
    marginBottom: 10,
  },

  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7C8AA6",
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: "#F7FBFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    overflow: "hidden",
  },

  row: {
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D7E3F2",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,58,89,0.08)",
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: "900", color: "#2E3A59" },
  rowSub: { marginTop: 2, fontSize: 11, fontWeight: "700", color: "#6B7A99" },
  rowRight: { fontSize: 10, fontWeight: "800", color: "#7C8AA6" },
});
