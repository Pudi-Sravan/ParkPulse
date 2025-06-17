import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    ScrollView,
    Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import Svg, { Path } from "react-native-svg";

type CategoryType = "Car" | "Bike" | "Abled";

const categories: { type: CategoryType; icon: string; color: string }[] = [
    { type: "Car", icon: "🚗", color: "#00FFFF" },
    { type: "Bike", icon: "🏍️", color: "#FFD700" },
    { type: "Abled", icon: "♿", color: "#FF69B4" },
];

const mockPredictions: Record<CategoryType, { wait: string; prob: string }> = {
    Car: { wait: "6 min", prob: "78%" },
    Bike: { wait: "2 min", prob: "93%" },
    Abled: { wait: "1 min", prob: "97%" },
};

const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const PredictionCalendarScreen = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [visitTime, setVisitTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const onChangeTime = (_: any, selected?: Date) => {
        setShowTimePicker(false);
        if (selected) setVisitTime(selected);
    };

    const screenWidth = Dimensions.get("window").width;

    return (
        <View style={{ flex: 1, backgroundColor: "#0F0D23" }}>
            {/* Top Section */}
            <View
                style={{
                    backgroundColor: "#181A30",
                    paddingTop: 40,
                    paddingBottom: 60,
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "white", fontSize: 26, fontWeight: "bold", marginBottom: 6 }}>
                    Plan Your Visit
                </Text>
                <Text style={{ color: "#A8B5DB", fontSize: 15, textAlign: "center" }}>
                    Walmart Supercenter, 1123 Main St.
                </Text>
            </View>

            {/* Curved Divider SVG */}
            <Svg
                height="60"
                width={screenWidth}
                style={{ position: "absolute", top: 110, left: 0 }}
            >
                <Path
                    d={`
      M0,0
      Q${screenWidth / 2},60 ${screenWidth},0
      L${screenWidth},60
      L0,60
      Z
    `}
                    fill="#0F0D23"
                />
            </Svg>
            {/* Scroll Content */}
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 40, paddingTop: 0 }}
            >
                <Text style={{ color: "#00FFFF", fontSize: 18, marginBottom: 10 }}>
                    Select your visit time and date:
                </Text>

                {/* Calendar */}
                <Calendar
                    markedDates={{
                        [selectedDate]: { selected: true, selectedColor: "#00FFFF" },
                    }}
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    theme={{
                        calendarBackground: "#181636",
                        dayTextColor: "#FFFFFF",
                        textSectionTitleColor: "#A8B5DB",
                        selectedDayBackgroundColor: "#00FFFF",
                        selectedDayTextColor: "#0F0D23",
                        todayTextColor: "#00FFFF",
                        arrowColor: "#00FFFF",
                        monthTextColor: "#FFFFFF",
                    }}
                />

                {/* Visit Time Picker Styled as before */}
                <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={{
                        backgroundColor: "#181636",
                        padding: 14,
                        borderRadius: 12,
                        marginTop: 20,
                        marginBottom: 18,
                    }}
                >
                    <Text style={{ color: "#A8B5DB", fontSize: 16 }}>
                        🕒 Visit Time: {formatTime(visitTime)}
                    </Text>
                </TouchableOpacity>

                {showTimePicker && (
                    <DateTimePicker
                        mode="time"
                        value={visitTime}
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onChangeTime}
                    />
                )}

                {/* Predictions */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                    {categories.map(({ type, icon, color }) => (
                        <View
                            key={type}
                            style={{
                                flex: 1,
                                backgroundColor: "#181636",
                                paddingTop: 15,
                                paddingBottom:25,
                                borderRadius: 14,
                                alignItems: "center",
                                borderColor: color,
                                borderWidth: 1.2,
                            }}
                        >
                            <Text style={{ fontSize: 33 }}>{icon}</Text>
                            <Text style={{ color: "white", marginTop: 6, fontSize: 16 }}>{type}</Text>
                            <Text style={{ color: "#A8B5DB", marginTop: 10, fontSize: 13 }}>
                                Avg Wait: <Text style={{ color }}>{mockPredictions[type].wait}</Text>
                            </Text>
                            <Text style={{ color: "#A8B5DB", fontSize: 13, marginTop: 2 }}>
                                Availability: <Text style={{ color }}>{mockPredictions[type].prob}</Text>
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default PredictionCalendarScreen;
