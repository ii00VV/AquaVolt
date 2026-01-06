import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const STORAGE_KEY = "aquavolt_has_seen_onboarding";

export default function OnboardingScreen({ navigation }) {
  const slides = useMemo(
    () => [
      {
        key: "harvest",
        title: "Harvest Rainwater",
        desc: "Collect and store rainwater efficiently with our smart monitoring system",
        icon: "water-outline",
        gradient: ["#4F8DF7", "#2B5BD7"],
      },
      {
        key: "generate",
        title: "Generate Electricity",
        desc: "Convert water flow into clean micro-hydro energy for your home",
        icon: "flash-outline",
        gradient: ["#0B7AAE", "#034E77"],
      },
      {
        key: "monitor",
        title: "Monitor Your System",
        desc: "Track real-time metrics, energy production, and system health from anywhere",
        icon: "analytics-outline",
        gradient: ["#2ED3B7", "#1B8DBA"],
      },
    ],
    []
  );

  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const markDoneAndGo = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
    } catch (e) {}
    navigation.replace("Login");
  };

  const scrollTo = (targetIndex) => {
    try {
      listRef.current?.scrollToIndex({ index: targetIndex, animated: true });
    } catch (e) {}
  };

  const onNext = () => {
    const nextIndex = Math.min(index + 1, slides.length - 1);
    setIndex(nextIndex);
    scrollTo(nextIndex);
  };

  const onSkip = () => markDoneAndGo();

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconWrap}>
        <LinearGradient colors={item.gradient} style={styles.iconCircle}>
          <Ionicons name={item.icon} size={34} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.header} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            getItemLayout={(_, i) => ({
              length: width,
              offset: width * i,
              index: i,
            })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setIndex(newIndex);
            }}
            onScrollToIndexFailed={({ index: failedIndex }) => {
              setTimeout(() => scrollTo(failedIndex), 200);
            }}
          />

          <View style={styles.footer}>
            <View style={styles.dotsRow}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === index ? styles.dotActive : null]}
                />
              ))}
            </View>

            <View style={styles.bottomRow}>
              {index < slides.length - 1 ? (
                <>
                  <Pressable style={styles.skipBtn} onPress={onSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                  </Pressable>

                  <Pressable style={styles.nextBtn} onPress={onNext}>
                    <Text style={styles.nextText}>Next</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.getStartedBtn} onPress={markDoneAndGo}>
                  <Text style={styles.getStartedText}>Get Started</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },
  header: { height: 72 },
  safe: { flex: 1 },
  body: { flex: 1 },

  listContent: {
    paddingBottom: 140,
  },

  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },

  iconWrap: { marginBottom: 6 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B1220",
    textAlign: "center",
  },
  desc: {
    fontSize: 12,
    color: "#6A7CA3",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    paddingHorizontal: 22,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#C7D3EA",
  },
  dotActive: {
    width: 28,
    backgroundColor: "#3D73E0",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 280,
    alignSelf: "center",
  },

  skipBtn: {
    width: 120,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  skipText: { color: "#7B879E", fontWeight: "700" },

  nextBtn: {
    width: 120,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#3D73E0",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  nextText: { color: "white", fontWeight: "800" },

  getStartedBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#3D73E0",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  getStartedText: { color: "white", fontWeight: "800" },
});
