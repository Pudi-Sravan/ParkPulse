import { Client, Databases, ID, Query } from "react-native-appwrite";
import axios from "axios";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const PARKING_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PARKING_COLLECTION_ID!;
const WAITLOG_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_WAITLOG_COLLECTION_ID!;
const EVENT_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_EVENT_COLLECTION_ID!;
const FLASK_SERVER_URL = process.env.EXPO_PUBLIC_FLASK_SERVER!;

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const database = new Databases(client);
console.log(database)
export const fetchSlots = async (): Promise<Record<string, boolean>> => {
  try {
    const res = await database.listDocuments(DATABASE_ID, PARKING_COLLECTION_ID);
    const data: Record<string, boolean> = {};

    res.documents.forEach((doc) => {
      data[doc.Slotid] = doc.Vacancy;
    });
    return data;
  } catch (error) {
    console.error("Error fetching slots:", error);
    return {};
  }
};

export const toggleSlotVacancy = async (slotId: string, currentStatus: boolean) => {
  const now = new Date();
  const isoTime = now.toISOString();

  const slotType = slotId.startsWith("C")
    ? "car"
    : slotId.startsWith("B")
      ? "bike"
      : slotId.startsWith("A")
        ? "abled"
        : "unknown";

  try {
    const res = await database.listDocuments(DATABASE_ID, PARKING_COLLECTION_ID, [
      Query.equal("Slotid", slotId),
    ]);

    const existingDoc = res.documents[0];
    const newStatus = !currentStatus;

    // ⬛ Update or create the slot document
    if (existingDoc) {
      await database.updateDocument(DATABASE_ID, PARKING_COLLECTION_ID, existingDoc.$id, {
        Vacancy: newStatus,
        ...(newStatus === false ? { check_in: isoTime } : { check_out: isoTime }),
      });
    } else {
      await database.createDocument(DATABASE_ID, PARKING_COLLECTION_ID, ID.unique(), {
        Slotid: slotId,
        Vacancy: newStatus,
        check_in: newStatus === false ? isoTime : null,
        check_out: newStatus === true ? isoTime : null,
        slot_type: slotType,
      });
    }

    // ⬛ Handle Occupy
    if (newStatus === false) {
      const allSlots = await database.listDocuments(DATABASE_ID, PARKING_COLLECTION_ID, [
        Query.equal("slot_type", slotType),
      ]);

      const allOccupied = allSlots.documents.every((doc) => doc.Vacancy === false);

      if (allOccupied) {
        const eventRes = await database.listDocuments(DATABASE_ID, EVENT_COLLECTION_ID, [
          Query.equal("event_date", isoTime.split("T")[0]),
        ]);

        const isEventDay = eventRes.documents.length > 0 ? 1 : 0;
        const eventType = isEventDay ? eventRes.documents[0].event_type : "regular";

        await database.createDocument(DATABASE_ID, WAITLOG_COLLECTION_ID, ID.unique(), {
          slotid: slotId,
          category: slotType,
          check_in: isoTime,
          wait_time: null,
        });
      }
    }

    // ⬛ Handle Vacate
    if (newStatus === true) {
      const { dayOfWeek } = getDayInfo(isoTime);
      const eventRes = await database.listDocuments(DATABASE_ID, EVENT_COLLECTION_ID, [
        Query.equal("event_date", isoTime.split("T")[0]),
      ]);
      const isEventDay = eventRes.documents.length > 0 ? 1 : 0;
      const eventType = isEventDay ? eventRes.documents[0].event_type : "regular";

      // 🔵 Send slot vacated data (always)
      if (existingDoc?.check_in) {
        const payload = {
          slot_id: slotId,
          checkin_timestamp: existingDoc.check_in,
          checkout_timestamp: isoTime,
          day_of_week: dayOfWeek,
          slot_type: slotType,
          event_type: eventType,
          is_event_day: isEventDay,
          wait_time_minute: 0,
        };
        try {
          await axios.post(`${FLASK_SERVER_URL}/newdata`, payload);
        } catch (axiosErr) {
          console.error("Flask Error (vacated slot):", axiosErr?.response?.data || axiosErr.message);
        }
      }

      // 🔵 Check for wait log and post that too if exists
      const logs = await database.listDocuments(DATABASE_ID, WAITLOG_COLLECTION_ID, [
        Query.equal("category", slotType),
        Query.isNull("check_out"),
      ]);

      if (logs.documents.length > 0) {
        const firstLog = logs.documents[0];
        const checkin = new Date(firstLog.check_in);
        const waitTime = Math.max(0, Math.floor((now.getTime() - checkin.getTime()) / 60000));

        // ⬛ Update waitlog
        await database.updateDocument(DATABASE_ID, WAITLOG_COLLECTION_ID, firstLog.$id, {
          check_out: isoTime,
          wait_time: waitTime,
        });

        const waitPayload = {
          slot_id: slotId,
          checkin_timestamp: firstLog.check_in,
          checkout_timestamp: isoTime,
          day_of_week: dayOfWeek,
          slot_type: slotType,
          event_type: eventType,
          is_event_day: isEventDay,
          wait_time_minute: waitTime,
        };

        try {
          await axios.post(`${FLASK_SERVER_URL}/newdata`, waitPayload);
        } catch (axiosErr) {
          console.error("Flask Error (wait log):", axiosErr?.response?.data || axiosErr.message);
        }
      }
    }
  } catch (err) {
    console.error("Toggle slot error", err);
  }
};

// 📦 Utility
const getDayInfo = (isoDate: string) => {
  const date = new Date(isoDate);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayOfWeek = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday" ? 1 : 0;
  return { dayOfWeek, isWeekend };
};


// === Event Functions ===
// Updated createOrUpdateEvent to enforce unique date
export const createOrUpdateEvent = async (eventId: string | null, eventData: any) => {
  try {
    const dateStr = eventData.event_date;

    // Fetch if an event already exists for the same date
    const existingEvents = await fetchEvents();
    const existingForDate = existingEvents.find((e: any) => e.event_date.split("T")[0] === dateStr);

    if (eventId || existingForDate) {
      // If updating or duplicate found, update instead of creating
      const updateId = eventId || existingForDate?.$id;
      await database.updateDocument(DATABASE_ID, EVENT_COLLECTION_ID, updateId, eventData);
    } else {
      // If date is unique, create a new event
      await database.createDocument(DATABASE_ID, EVENT_COLLECTION_ID, ID.unique(), eventData);
    }
  } catch (error) {
    console.error("Error creating/updating event:", error);
  }
};


export const fetchEvents = async (filterType: string | null = null) => {
  try {
    const queries = filterType ? [Query.equal("event_type", filterType)] : [];
    const res = await database.listDocuments(DATABASE_ID, EVENT_COLLECTION_ID, queries);
    return res.documents;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    await database.deleteDocument(DATABASE_ID, EVENT_COLLECTION_ID, eventId);
  } catch (error) {
    console.error("Error deleting event:", error);
  }
};

