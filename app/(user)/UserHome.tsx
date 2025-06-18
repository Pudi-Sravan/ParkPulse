import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { images } from "@/constants/images";
import { fetchSlots, fetchEvents } from "@/services/appwrite";
import axios from "axios";

const FLASK_URL = `${process.env.EXPO_PUBLIC_FLASK_SERVER}/predict`;

type SlotType = "car" | "bike" | "abled";

type OccupancyMap = Record<string, boolean>;

interface EventInfo {
  is_event_day: number;
  event_type: string;
}

interface SlotProps {
  id: string;
  vacant: boolean;
}

const SLOTS: Record<SlotType, string[]> = {
  car: ["C1", "C2", "C3"],
  bike: ["B1", "B2"],
  abled: ["A1"],
};

const Slot: React.FC<SlotProps> = ({ id, vacant }) => {
  const getImageForSlot = () => {
    if (id.startsWith("C")) return vacant ? images.car : images.parkcar;
    if (id.startsWith("B")) return vacant ? images.bike : images.parkbike;
    if (id.startsWith("A")) return vacant ? images.abled : images.parkabled;
    return images.car;
  };

  const type: SlotType = id.startsWith("C") ? "car" : id.startsWith("B") ? "bike" : "abled";

  const OCCUPIED_IMAGE_SIZES: Record<SlotType, { width: number; height: number }> = {
    car: { width: 300, height: 400 },
    bike: { width: 220, height: 300 },
    abled: { width: 290, height: 290 },
  };

  const { width, height } = vacant
    ? { width: 60, height: 80 }
    : OCCUPIED_IMAGE_SIZES[type];

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 20,
      marginVertical: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: vacant ? "#0D1B2A" : "#1F1F1F",
      borderWidth: 1,
      borderColor: vacant ? "#00FF99" : "#FF2E63",
      overflow: "hidden",
    }}>
      <Text style={{ color: "#aaa", fontSize: 16 }}>{id}</Text>
      <View style={{ width: 60, height: 80, alignItems: "center", justifyContent: "center" }}>
        <Image source={getImageForSlot()} style={{ width, height, resizeMode: "contain", opacity: vacant ? 0.3 : 1 }} />
      </View>
      <Text style={{ color: vacant ? "#00FF99" : "#FF5E5E", fontWeight: "bold" }}>
        {vacant ? "Vacant" : "Occupied"}
      </Text>
    </View>
  );
};

const LiveParkingView: React.FC = () => {
  const [occupancy, setOccupancy] = useState<OccupancyMap>({});
  const [selected, setSelected] = useState<SlotType>("car");
  const [waitTime, setWaitTime] = useState<number | null>(null);
  const [loadingWaitTime, setLoadingWaitTime] = useState<boolean>(false);

  const latestSelected = useRef<SlotType>("car");
  const eventInfoRef = useRef<EventInfo>({ is_event_day: 0, event_type: "regular" });

  const isDataReady = SLOTS[selected].every((slot) => slot in occupancy);
  const anyVacant = isDataReady ? SLOTS[selected].some((slot) => occupancy[slot]) : false;

  const fetchEventStatus = async () => {
    try {
      const events = await fetchEvents();
      const today = new Date();
      const todayEvent = events.find((e: any) =>
        new Date(e.event_date).toDateString() === today.toDateString()
      );
      if (todayEvent) {
        eventInfoRef.current = {
          is_event_day: 1,
          event_type: todayEvent.event_type,
        };
      } else {
        eventInfoRef.current = { is_event_day: 0, event_type: "regular" };
      }
    } catch (err) {
      console.error("Error fetching event info:", err);
      eventInfoRef.current = { is_event_day: 0, event_type: "regular" };
    }
  };

  const predictWaitTime = async (
    slotType: SlotType,
    latest: OccupancyMap,
    showLoading: boolean = false
  ) => {
    const selectedSlots = SLOTS[slotType];
    const allOccupied = selectedSlots.every((slot) => !latest[slot]);

    if (allOccupied) {
      const now = new Date();
      const payload = {
        day_of_week: now.toLocaleDateString("en-US", { weekday: "long" }),
        slot_type: slotType,
        event_type: eventInfoRef.current.event_type,
        checkin_timestamp: now.toISOString().replace("T", " ").split(".")[0],
        is_event_day: eventInfoRef.current.is_event_day,
        is_weekend: now.getDay() === 0 || now.getDay() === 6 ? 1 : 0,
      };
      if (showLoading) setLoadingWaitTime(true);
      try {
        const res = await axios.post(FLASK_URL, payload);
        setWaitTime(res.data.predicted_wait_time_minutes);
      } catch (err) {
        console.error("Error fetching wait time:", err);
        setWaitTime(null);
      } finally {
        if (showLoading) setLoadingWaitTime(false);
      }
    } else {
      setWaitTime(null);
    }
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await fetchEventStatus();
      const latest = await fetchSlots();
      setOccupancy(latest);
      predictWaitTime(latestSelected.current, latest);
      timeout = setTimeout(loop, 1000);
    };

    loop();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    latestSelected.current = selected;
    setLoadingWaitTime(true);
    predictWaitTime(selected, occupancy, true);
  }, [selected]);

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={{ flex: 1, backgroundColor: "#181636" }}>
      <View style={{ padding: 5, alignItems: "center", backgroundColor: "#181636" }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "white", marginTop: 55 }}>
          Live Parking
        </Text>
        <Text style={{ color: "#A8B5DB", marginTop: 4, textAlign: "center" }}>
          Walmart Supercenter, 1123 Main St.
        </Text>
        <Text style={{
          color: anyVacant ? "#00FF00" : "#FF5E5E",
          fontSize: 20,
          marginTop: 14,
          fontWeight: "bold"
        }}>
          {isDataReady
            ? anyVacant
              ? "Vacant slots available"
              : "All slots occupied"
            : "Loading slots..."}
        </Text>
        {!anyVacant && (
          loadingWaitTime ? (
            <Text style={{ color: "#00FFFF", marginTop: 8, fontSize: 16 }}>Predicting time...</Text>
          ) : waitTime !== null && (
            <Text style={{ color: "#00FFFF", marginTop: 8, fontSize: 16 }}>
              Estimated Wait Time: {waitTime.toFixed(1)} mins
            </Text>
          )
        )}
        <Text style={{ color: "#888", marginTop: 6 }}>
          Time: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <Svg height="50" width={screenWidth}>
        <Path d={`M0,0 Q${screenWidth / 2},60 ${screenWidth},0 L${screenWidth},60 L0,60 Z`} fill="#0F0D23" />
      </Svg>
      <View style={{ backgroundColor: "#0F0D23", flex: 1, paddingBottom: 30 }}>
        <View style={{
          marginHorizontal: 20,
          borderRadius: 30,
          padding: 10,
          flexDirection: "row",
          justifyContent: "space-around",
          backgroundColor: "#222244",
          marginTop: 10,
        }}>
          {(Object.keys(SLOTS) as SlotType[]).map((type) => {
            const icon = type === "car" ? images.car : type === "bike" ? images.bike : images.abled;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelected(type)}
                style={{ alignItems: "center" }}
              >
                <Image source={icon} style={{
                  width: 30,
                  height: 30,
                  tintColor: selected === type ? "#00FFFF" : "#aaa"
                }} />
                <Text style={{
                  color: selected === type ? "#00FFFF" : "#aaa",
                  fontSize: 12,
                  marginTop: 4,
                }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ marginTop: 20 }}>
          {isDataReady && SLOTS[selected].map((slotId) => (
            <Slot key={slotId} id={slotId} vacant={occupancy[slotId]} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default LiveParkingView;
