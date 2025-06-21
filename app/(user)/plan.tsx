import React, { useEffect, useState } from "react";
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
import axios from "axios";
import { fetchEvents } from "@/services/appwrite";

const FLASK_URL = process.env.EXPO_PUBLIC_FLASK_SERVER || "http://localhost:5000";

const categories = [
    { type: "Car", icon: "🚗", color: "#00FFFF" },
    { type: "Bike", icon: "🏍️", color: "#FFD700" },
    { type: "Abled", icon: "♿", color: "#FF69B4" },
];

const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const PredictionCalendarScreen = () => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [visitTime, setVisitTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [eventInfo, setEventInfo] = useState<{ [key: string]: any }>({});
    const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
    const [predictions, setPredictions] = useState<any>({});

    const screenWidth = Dimensions.get("window").width;

    useEffect(() => {
        const loadEventsAndPredictions = async () => {
            try {
                const events = await fetchEvents();
                const marks: Record<string, any> = {};
                const eventMap: { [key: string]: any } = {};
                events.forEach((event: any) => {
                    const dateKey = event.event_date.split("T")[0];
                    eventMap[dateKey] = event;
                    const dotColor = event.event_type === "festival" ? "#39FF14" : "#FFFF33";
                    marks[dateKey] = {
                        selected: true,
                        customStyles: {
                            container: {
                                backgroundColor: dotColor,
                                borderRadius: 20,
                            },
                            text: {
                                color: "#0F0D23",
                                fontWeight: "bold",
                            },
                        },
                    };
                });
                setMarkedDates(marks);
                setEventInfo(eventMap);
            } catch (err) {
                console.error("Error fetching events:", err);
            }
        };
        loadEventsAndPredictions();
    }, []);

    useEffect(() => {
        const fetchPredictions = async () => {
            const day = new Date(`${selectedDate}T00:00:00`);
            const dayOfWeek = day.toLocaleDateString("en-US", { weekday: "long" });
            const checkinTimestamp = `${selectedDate} ${visitTime.toTimeString().split(" ")[0]}`;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6 ? 1 : 0;

            const e = eventInfo[selectedDate];
            const event_type = e?.event_type || "regular";
            const is_event_day = e ? 1 : 0;

            const allPredictions: any = {};

            for (const cat of categories) {
                try {
                    const payload = {
                        day_of_week: dayOfWeek,
                        slot_type: cat.type.toLowerCase(),
                        event_type,
                        checkin_timestamp: checkinTimestamp,
                        is_event_day,
                        is_weekend: isWeekend,
                    };

                    const availRes = await axios.post(`${FLASK_URL}/predict_availability`, payload);
                    const availability = availRes.data.probability_slot_available * 100;

                    let waitTime = null;
                    if (availability < 90) {
                        const waitRes = await axios.post(`${FLASK_URL}/predict`, payload);
                        waitTime = `${waitRes.data.predicted_wait_time_minutes.toFixed(1)} min`;
                    }

                    allPredictions[cat.type] = {
                        prob: `${availability.toFixed(0)}%`,
                        wait: waitTime,
                        border:
                            availability >= 90
                                ? "#39FF14"
                                : availability >= 50
                                ? "#FFFF33"
                                : "#FF3131",
                    };
                } catch (err) {
                    console.error(`Error fetching prediction for ${cat.type}:`, err);
                }
            }

            setPredictions(allPredictions);
        };

        fetchPredictions();
    }, [selectedDate, visitTime]);

    const onChangeTime = (_: any, selected?: Date) => {
        setShowTimePicker(false);
        if (selected) setVisitTime(selected);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#0F0D23" }}>
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

            <Svg
                height="60"
                width={screenWidth}
                style={{ position: "absolute", top: 110, left: 0 }}
            >
                <Path
                    d={`M0,0 Q${screenWidth / 2},60 ${screenWidth},0 L${screenWidth},60 L0,60 Z`}
                    fill="#0F0D23"
                />
            </Svg>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 40, paddingTop: 0 }}
            >
                <Text style={{ color: "#00FFFF", fontSize: 18, marginBottom: 10 }}>
                    Select your visit time and date:
                </Text>

                <Calendar
                    markedDates={{
                        ...markedDates,
                        [selectedDate]: {
                            ...(markedDates[selectedDate] || {}),
                            selected: true,
                            customStyles: {
                                container: {
                                    backgroundColor: "#00FFFF",
                                    borderRadius: 20,
                                },
                                text: {
                                    color: "#0F0D23",
                                    fontWeight: "bold",
                                },
                            },
                        },
                    }}
                    markingType="custom"
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

                <View style={{ flexDirection: "row", gap: 10 }}>
                    {categories.map(({ type, icon }) => (
                        <View
                            key={type}
                            style={{
                                flex: 1,
                                backgroundColor: "#181636",
                                paddingTop: 15,
                                paddingBottom: 25,
                                borderRadius: 14,
                                alignItems: "center",
                                borderColor: predictions[type]?.border || "#666",
                                borderWidth: 1.2,
                            }}
                        >
                            <Text style={{ fontSize: 33 }}>{icon}</Text>
                            <Text style={{ color: "white", marginTop: 6, fontSize: 16 }}>{type}</Text>
                            <Text style={{ color: "#A8B5DB", marginTop: 10, fontSize: 11 }}>
                                Availability: <Text style={{ color: predictions[type]?.border }}>{predictions[type]?.prob || "--"}</Text>
                            </Text>
                            {predictions[type]?.wait && (
                                <Text style={{ color: "#A8B5DB", fontSize: 11, marginTop: 2 }}>
                                    Avg Wait: <Text style={{ color: predictions[type].border }}>{predictions[type].wait}</Text>
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default PredictionCalendarScreen;
