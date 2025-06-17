import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { images } from "@/constants/images";
import { fetchSlots } from "@/services/appwrite";

type SlotType = "car" | "bike" | "abled";

const SLOTS: Record<SlotType, string[]> = {
  car: ["C1", "C2", "C3"],
  bike: ["B1", "B2"],
  abled: ["A1"],
};

interface SlotProps {
  id: string;
  vacant: boolean;
}

const Slot: React.FC<SlotProps> = ({ id, vacant }) => {
  const getImageForSlot = () => {
    if (id.startsWith("C")) return vacant ? images.car : images.parkcar;
    if (id.startsWith("B")) return vacant ? images.bike : images.parkbike;
    if (id.startsWith("A")) return vacant ? images.abled : images.parkabled;
    return images.car;
  };

  const getSlotType = (): SlotType => {
    if (id.startsWith("C")) return "car";
    if (id.startsWith("B")) return "bike";
    return "abled";
  };

  const type = getSlotType();

  const OCCUPIED_IMAGE_SIZES: Record<SlotType, { width: number; height: number }> = {
    car: { width: 300, height: 400 },
    bike: { width: 220, height: 300 },
    abled: { width: 290, height: 290 },
  };

  const { width, height } = vacant
    ? { width: 60, height: 80 }
    : OCCUPIED_IMAGE_SIZES[type];

  return (
    <View
      style={{
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
      }}
    >
      <Text style={{ color: "#aaa", fontSize: 16 }}>{id}</Text>

      <View
        style={{
          width: 60,
          height: 80,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={getImageForSlot()}
          style={{
            width,
            height,
            resizeMode: "contain",
            opacity: vacant ? 0.3 : 1,
          }}
        />
      </View>

      <Text style={{ color: vacant ? "#00FF99" : "#FF5E5E", fontWeight: "bold" }}>
        {vacant ? "Vacant" : "Occupied"}
      </Text>
    </View>
  );
};

const LiveParkingView: React.FC = () => {
  const [occupancy, setOccupancy] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<SlotType>("car");

  const isDataReady = SLOTS[selected].every((slot) => slot in occupancy);
  const anyVacant = isDataReady ? SLOTS[selected].some((slot) => occupancy[slot]) : false;

  useEffect(() => {
    const updateOccupancy = async () => {
      const latest = await fetchSlots();
      setOccupancy(latest);
    };

    updateOccupancy(); // Initial fetch

    const interval = setInterval(updateOccupancy, 1000); // Update every 1 sec

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  return (
    <View style={{ flex: 1, backgroundColor: "#181636" }}>
      {/* Top Header */}
      <View style={{ padding: 5, alignItems: "center", backgroundColor: "#181636" }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "white", marginTop: 55 }}>
          Live Parking
        </Text>
        <Text style={{ color: "#A8B5DB", marginTop: 4, textAlign: "center" }}>
          Walmart Supercenter, 1123 Main St.
        </Text>

        <Text
          style={{
            color: anyVacant ? "#00FF00" : "#FF5E5E",
            fontSize: 20,
            marginTop: 14,
            fontWeight: "bold",
          }}
        >
          {isDataReady
            ? anyVacant
              ? "Vacant slots available"
              : "Next available in 7 min"
            : "Loading slots..."}
        </Text>

        <Text style={{ color: "#888", marginTop: 6 }}>
          Time:{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Curved Divider */}
      <Svg height="50" width={screenWidth}>
        <Path
          d={`M0,0 Q${screenWidth / 2},60 ${screenWidth},0 L${screenWidth},60 L0,60 Z`}
          fill="#0F0D23"
        />
      </Svg>

      {/* Bottom Panel */}
      <View style={{ backgroundColor: "#0F0D23", flex: 1, paddingBottom: 30 }}>
        {/* Slot Type Selector */}
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 30,
            padding: 10,
            flexDirection: "row",
            justifyContent: "space-around",
            backgroundColor: "#222244",
            marginTop: 10,
          }}
        >
          {(Object.keys(SLOTS) as SlotType[]).map((type) => {
            const icon =
              type === "car"
                ? images.car
                : type === "bike"
                ? images.bike
                : images.abled;

            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelected(type)}
                style={{ alignItems: "center" }}
              >
                <Image
                  source={icon}
                  style={{
                    width: 30,
                    height: 30,
                    tintColor: selected === type ? "#00FFFF" : "#aaa",
                  }}
                />
                <Text
                  style={{
                    color: selected === type ? "#00FFFF" : "#aaa",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slot List */}
        <View style={{ marginTop: 20 }}>
          {isDataReady &&
            SLOTS[selected].map((slotId) => (
              <Slot key={slotId} id={slotId} vacant={occupancy[slotId]} />
            ))}
        </View>
      </View>
    </View>
  );
};

export default LiveParkingView;
