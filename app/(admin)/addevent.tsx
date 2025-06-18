import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Dimensions,
    ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Svg, { Path } from "react-native-svg";
import {
    fetchEvents,
    createOrUpdateEvent,
    deleteEvent,
} from "@/services/appwrite";

const screenWidth = Dimensions.get("window").width;

const PredictionCalendarScreen = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [eventType, setEventType] = useState<"salesday" | "festival">("salesday");
    const [eventName, setEventName] = useState("");
    const [existingEventId, setExistingEventId] = useState<string | null>(null);
    const [allEvents, setAllEvents] = useState<any[]>([]);

    const loadAndMarkEvents = async () => {
        const events = await fetchEvents();
        setAllEvents(events);
        const newMarks: Record<string, any> = {};
        events.forEach((event: any) => {
            const dateKey = event.event_date.split("T")[0];
            newMarks[dateKey] = {
                selected: true,
                marked: true,
                dotColor: event.event_type === "festival" ? "#39FF14" : "#FFFF33",
                customStyles: {
                    container: {
                        backgroundColor: event.event_type === "festival" ? "#39FF14" : "#FFFF33",
                        borderRadius: 10,
                    },
                    text: {
                        color: "#0F0D23",
                        fontWeight: "bold",
                    },
                },
            };
        });
        setMarkedDates(newMarks);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            loadAndMarkEvents();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDayPress = async (day: any) => {
        const today = new Date().toISOString().split("T")[0];
        if (day.dateString < today) return; // Prevent past date selection

        setSelectedDate(day.dateString);
        const existing = allEvents.find((e: any) => e.event_date.split("T")[0] === day.dateString);
        if (existing) {
            setEventType(existing.event_type);
            setEventName(existing.event_name);
            setExistingEventId(existing.$id);
        } else {
            setEventType("salesday");
            setEventName("");
            setExistingEventId(null);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        const existing = allEvents.find((e: any) => e.event_date.split("T")[0] === selectedDate);
        const eventId = existing ? existing.$id : existingEventId;
        const data = {
            event_date: selectedDate,
            event_type: eventType,
            event_name: eventName,
        };
        await createOrUpdateEvent(eventId, data);
        await loadAndMarkEvents();
        setModalVisible(false);
    };

    const handleDelete = async () => {
        if (existingEventId) {
            await deleteEvent(existingEventId);
            await loadAndMarkEvents();
            setModalVisible(false);
        }
    };

    const upcomingEvents = allEvents
        .filter((e: any) => new Date(e.event_date) >= new Date())
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .slice(0, 3);

    return (
        <View style={{ flex: 1, backgroundColor: "#0F0D23" }}>
            {/* Header */}
            <View style={{ backgroundColor: "#181A30", paddingTop: 40, paddingBottom: 60, alignItems: "center" }}>
                <Text style={{ color: "#00FFFF", fontSize: 26, fontWeight: "bold" }}>Event Calendar</Text>
                <Text style={{ color: "#A8B5DB" }}>Tap on a date to add or edit events</Text>
            </View>

            {/* Curved Divider */}
            <Svg height="60" width={screenWidth} style={{ position: "absolute", top: 110, left: 0 }}>
                <Path
                    d={`M0,0 Q${screenWidth / 2},60 ${screenWidth},0 L${screenWidth},60 L0,60 Z`}
                    fill="#0F0D23"
                />
            </Svg>

            <ScrollView style={{ marginTop: 20, paddingHorizontal: 20 }}>
                <Calendar
                    markedDates={markedDates}
                    onDayPress={handleDayPress}
                    markingType={'custom'}
                    theme={{
                        calendarBackground: "#181636",
                        dayTextColor: "#FFFFFF",
                        textSectionTitleColor: "#A8B5DB",
                        todayTextColor: "#00FFFF",
                        arrowColor: "#00FFFF",
                        monthTextColor: "#FFFFFF",
                    }}
                />

                {/* Upcoming Events */}
                <View style={{ marginTop: 15 }}>
                    <Text style={{ color: "#00FFFF", fontSize: 18, marginBottom: 10 }}>Upcoming Events</Text>
                    {upcomingEvents.map((e, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#1C1F3B",
                                padding: 14,
                                borderRadius: 12,
                                marginBottom: 10,
                            }}
                        >
                            <View>
                                <Text style={{ color: "#fff", fontSize: 16 }}>{e.event_name}</Text>
                                <Text style={{ color: "#A8B5DB", marginTop: 4 }}>{e.event_date.split("T")[0]}</Text>
                            </View>
                            <Text style={{ color: e.event_type === "festival" ? "#39FF14" : "#FFFF33", fontWeight: "bold" }}>
                                {e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <View style={{ width: "85%", backgroundColor: "#0F0D23", padding: 20, borderRadius: 14, borderColor: "#00FFFF", borderWidth: 1 }}>
                        <Text style={{ color: "#00FFFF", fontSize: 20, marginBottom: 14, fontWeight: "bold" }}>
                            {existingEventId ? "Edit Event" : "Add Event"} for {selectedDate}
                        </Text>

                        <TextInput
                            placeholder="Event Name"
                            placeholderTextColor="#aaa"
                            value={eventName}
                            onChangeText={setEventName}
                            style={{ backgroundColor: "#181636", padding: 12, borderRadius: 8, color: "white", marginBottom: 16 }}
                        />

                        <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
                            <TouchableOpacity onPress={() => setEventType("salesday")}
                                style={{ backgroundColor: eventType === "salesday" ? "#FFFF33" : "#333", padding: 10, borderRadius: 8 }}>
                                <Text style={{ color: eventType === "salesday" ? "#000" : "#fff" }}>Sales Day</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEventType("festival")}
                                style={{ backgroundColor: eventType === "festival" ? "#39FF14" : "#333", padding: 10, borderRadius: 8 }}>
                                <Text style={{ color: eventType === "festival" ? "#000" : "#fff" }}>Festival</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            {existingEventId && (
                                <TouchableOpacity onPress={handleDelete}>
                                    <Text style={{ color: "#FF4444" }}>Delete</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={{ color: "#999" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave}>
                                <Text style={{ color: "#00FFFF" }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PredictionCalendarScreen;
