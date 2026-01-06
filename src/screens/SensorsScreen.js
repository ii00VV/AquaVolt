import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polyline, Line, Text as SvgText, G } from "react-native-svg";
import { auth } from "../services/firebase";
import { getSavedDevice } from "../services/deviceStore";

function formatShortDate(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function MiniLineChart({ data = [], width = 280, height = 140, yLabel = "", xLabel = "Time (24-hour)" }) {
  const padTop = 10;
  const padBottom = 20;
  const padLeft = 54;
  const padRight = 10;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const { points, minY, maxY } = useMemo(() => {
    if (!data?.length) return { points: "", minY: 0, maxY: 1 };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;

    const pts = data.map((v, i) => {
      const x = padLeft + (innerW * i) / (data.length - 1 || 1);
      const y = padTop + innerH - ((v - min) / span) * innerH;
      return `${x},${y}`;
    });

    return { points: pts.join(" "), minY: min, maxY: max };
  }, [data, innerW, innerH, padLeft, padTop]);

  const ticks = useMemo(() => {
    const t0 = minY;
    const t1 = (minY + maxY) / 2;
    const t2 = maxY;
    return [t2, t1, t0];
  }, [minY, maxY]);

  const yLabelX = 14;
  const yLabelY = padTop + innerH / 2;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + innerH} stroke="#BFC7D6" strokeWidth="1" />
        <Line
          x1={padLeft}
          y1={padTop + innerH}
          x2={padLeft + innerW}
          y2={padTop + innerH}
          stroke="#BFC7D6"
          strokeWidth="1"
        />

        {ticks.map((t, idx) => {
          const y = padTop + (innerH * idx) / (ticks.length - 1 || 1);
          return (
            <G key={`tick-${idx}`}>
              <Line x1={padLeft - 4} y1={y} x2={padLeft} y2={y} stroke="#BFC7D6" strokeWidth="1" />
              <SvgText x={padLeft - 8} y={y + 4} fontSize="9" fill="#8B97AD" textAnchor="end">
                {t.toFixed(1)}
              </SvgText>
            </G>
          );
        })}

        <Polyline
          points={points}
          fill="none"
          stroke="#2E5BFF"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <SvgText x={padLeft + innerW / 2} y={height - 4} fontSize="9" fill="#8B97AD" textAnchor="middle">
          {xLabel}
        </SvgText>

        {!!yLabel && (
          <SvgText
            x={yLabelX}
            y={yLabelY}
            fontSize="9"
            fill="#8B97AD"
            textAnchor="middle"
            transform={`rotate(-90 ${yLabelX} ${yLabelY})`}
          >
            {yLabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

function SensorChartCard({ title, currentText, dateText, onPress, data, yLabel }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(360, width * 0.86);
  const chartW = cardW - 28;
  const chartH = 140;

  return (
    <Pressable onPress={onPress} style={[styles.card, { width: cardW }]}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle}>{title}</Text>

        <View style={styles.cardRight}>
          <Text style={styles.cardDate}>{dateText}</Text>
          <Ionicons name="chevron-forward" size={16} color="#8B97AD" />
        </View>
      </View>

      <Text style={styles.cardSub}>{currentText}</Text>

      <View style={styles.divider} />

      <View style={styles.chartWrap}>
        <MiniLineChart data={data} width={chartW} height={chartH} yLabel={yLabel} xLabel="Time (24-hour)" />
      </View>

      <Text style={styles.tapHint}>Tap to view details</Text>
    </Pressable>
  );
}

function NoDeviceCard({ onAddDevice }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>Sensor Data</Text>
      <Text style={styles.emptySub}>
        No device connected yet. Add your AquaVolt ESP32 to view 24hr monitoring and sensor charts.
      </Text>

      <View style={styles.quickCard}>
        <Text style={styles.quickTitle}>Quick Actions</Text>

        <Pressable onPress={onAddDevice} style={styles.quickBtn}>
          <Ionicons name="add" size={18} color="#2F5FE8" />
          <Text style={styles.quickBtnText}>Add Device</Text>
        </Pressable>
      </View>
    </View>
  );
}

function calcStats(data = []) {
  if (!data.length) return { min: 0, max: 0, avg: 0, count: 0 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;
  return { min, max, avg, count: data.length };
}

function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function SensorsScreen({ navigation }) {
  const today = useMemo(() => formatShortDate(new Date()), []);

  const voltageData = [22.1, 22.4, 22.8, 23.5, 24.2, 24.9, 24.6, 24.0, 23.6, 24.3, 25.1, 24.4, 23.0];
  const flowData = [6.2, 6.8, 7.6, 8.4, 9.2, 10.4, 12.8, 13.4, 12.6, 11.8, 12.9, 13.3, 11.1];

  const batteryData = [77, 79, 81, 83, 85, 87, 89, 90, 88, 86, 85];
  const batteryCurrent = batteryData[batteryData.length - 1];

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState(null);

  const { width } = useWindowDimensions();
  const modalW = Math.min(420, width * 0.92);
  const bigChartW = modalW - 28;
  const bigChartH = 220;

  const stats = useMemo(() => calcStats(detail?.data || []), [detail]);

  const openDetail = (payload) => {
    setDetail(payload);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setDetail(null);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    const d = await getSavedDevice(uid);
    setDevice(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const goAddDevice = () => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) parent.navigate("AddDeviceFlow");
    else navigation.navigate("AddDeviceFlow");
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={require("../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>Sensor Data</Text>
          <Text style={styles.pageSub}>24hr monitoring</Text>
        </View>

        {!loading && !device && <NoDeviceCard onAddDevice={goAddDevice} />}

        {!loading && !!device && (
          <>
            <SensorChartCard
              title="Voltage Output"
              currentText="Current: 22.4V"
              dateText={today}
              data={voltageData}
              yLabel="Voltage (V)"
              onPress={() =>
                openDetail({
                  title: "Voltage Output",
                  currentText: "Current: 22.4V",
                  dateText: today,
                  data: voltageData,
                  yLabel: "Voltage (V)",
                  unitShort: "V",
                })
              }
            />

            <SensorChartCard
              title="Flow RPM"
              currentText="Current: 12.4 L/min"
              dateText={today}
              data={flowData}
              yLabel="Flow (L/min)"
              onPress={() =>
                openDetail({
                  title: "Flow RPM",
                  currentText: "Current: 12.4 L/min",
                  dateText: today,
                  data: flowData,
                  yLabel: "Flow (L/min)",
                  unitShort: "L/min",
                })
              }
            />

            <SensorChartCard
              title="Battery Level"
              currentText={`Current: ${batteryCurrent}%`}
              dateText={today}
              data={batteryData}
              yLabel="Battery (%)"
              onPress={() =>
                openDetail({
                  title: "Battery Level",
                  currentText: `Current: ${batteryCurrent}%`,
                  dateText: today,
                  data: batteryData,
                  yLabel: "Battery (%)",
                  unitShort: "%",
                })
              }
            />
          </>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingTitle}>Loading...</Text>
            <Text style={styles.loadingSub}>Checking connected device.</Text>
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal visible={detailVisible} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: modalW }]}>
            <View style={styles.modalTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{detail?.title || "Chart"}</Text>
                <Text style={styles.modalSub}>{detail?.currentText || ""}</Text>
              </View>

              <Pressable onPress={closeDetail} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={18} color="#0B1220" />
              </Pressable>
            </View>

            <View style={styles.modalMetaRow}>
              <Ionicons name="calendar-outline" size={14} color="#7C8AA6" />
              <Text style={styles.modalMetaText}>{detail?.dateText || ""}</Text>
              <View style={{ flex: 1 }} />
            </View>

            <View style={styles.modalDivider} />

            <View style={{ alignItems: "center" }}>
              <MiniLineChart
                data={detail?.data || []}
                width={bigChartW}
                height={bigChartH}
                yLabel={detail?.yLabel || ""}
                xLabel="Time (24-hour)"
              />
            </View>

            <View style={styles.statsRow}>
              <StatPill label="Min" value={`${stats.min.toFixed(1)} ${detail?.unitShort || ""}`} />
              <StatPill label="Avg" value={`${stats.avg.toFixed(1)} ${detail?.unitShort || ""}`} />
              <StatPill label="Max" value={`${stats.max.toFixed(1)} ${detail?.unitShort || ""}`} />
            </View>

            <Pressable onPress={closeDetail} style={styles.modalPrimaryBtn}>
              <Text style={styles.modalPrimaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 38, height: 38 },
  headerBrand: { color: "#fff", fontSize: 22, fontWeight: "900" },

  scroll: { flex: 1 },
  scrollContent: { alignItems: "center", paddingTop: 14, paddingBottom: 10 },

  pageTitleWrap: { width: "86%", maxWidth: 360, marginBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#0B1220" },
  pageSub: { marginTop: 2, fontSize: 12, color: "#7C8AA6", fontWeight: "600" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardDate: { fontSize: 11, fontWeight: "700", color: "#7C8AA6" },
  cardSub: { marginTop: 6, fontSize: 12, color: "#2B3A55", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#D8E0EF", marginTop: 10, marginBottom: 10 },
  chartWrap: { alignItems: "center", justifyContent: "center" },
  tapHint: { marginTop: 8, fontSize: 10, fontWeight: "800", color: "#8B97AD" },

  emptyWrap: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#F7FBFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220" },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6", lineHeight: 16 },

  quickCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
  },
  quickTitle: { fontSize: 12, fontWeight: "900", color: "#2E3A59", marginBottom: 10 },
  quickBtn: {
    backgroundColor: "#EEF5FF",
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  quickBtnText: { fontSize: 13, fontWeight: "900", color: "#2F5FE8" },

  loadingCard: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },
  loadingTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },
  loadingSub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
  },
  modalTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220" },
  modalSub: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#2B3A55" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D8E0EF",
    alignItems: "center",
    justifyContent: "center",
  },

  modalMetaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  modalMetaText: { fontSize: 11, fontWeight: "800", color: "#7C8AA6" },
  modalDivider: { height: 1, backgroundColor: "#D8E0EF", marginTop: 10, marginBottom: 10 },

  statsRow: { marginTop: 12, flexDirection: "row", gap: 10, justifyContent: "space-between" },
  statPill: {
    flex: 1,
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D7E3F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statLabel: { fontSize: 10, fontWeight: "900", color: "#7C8AA6" },
  statValue: { marginTop: 4, fontSize: 13, fontWeight: "900", color: "#0B1220" },

  modalPrimaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
