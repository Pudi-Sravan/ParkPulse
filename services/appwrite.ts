// appwrite.ts
import { Client, Databases, ID, Query, Account } from "react-native-appwrite";
import axios from "axios";
import SHA256 from "crypto-js/sha256";

// 🔐 Environment Variables
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const PARKING_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PARKING_COLLECTION_ID!;
const WAITLOG_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_WAITLOG_COLLECTION_ID!;
const EVENT_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_EVENT_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
const FLASK_SERVER_URL = process.env.EXPO_PUBLIC_FLASK_SERVER!;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;

// ⚙️ Appwrite Client
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

const database = new Databases(client);
const account = new Account(client);

// ============================ 🔲 SLOT FUNCTIONS ============================

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

  const slotType =
    slotId.startsWith("C") ? "car" :
    slotId.startsWith("B") ? "bike" :
    slotId.startsWith("A") ? "abled" :
    "unknown";

  try {
    const res = await database.listDocuments(DATABASE_ID, PARKING_COLLECTION_ID, [
      Query.equal("Slotid", slotId),
    ]);

    const existingDoc = res.documents[0];
    const newStatus = !currentStatus;

    // 🔁 Update/Create
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

    // ⬛ Occupy
    if (!newStatus) {
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

    // ⬛ Vacate
    if (newStatus) {
      const { dayOfWeek } = getDayInfo(isoTime);

      const eventRes = await database.listDocuments(DATABASE_ID, EVENT_COLLECTION_ID, [
        Query.equal("event_date", isoTime.split("T")[0]),
      ]);
      const isEventDay = eventRes.documents.length > 0 ? 1 : 0;
      const eventType = isEventDay ? eventRes.documents[0].event_type : "regular";

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
        } catch (err) {
          console.error("Flask Error (vacated):", err?.response?.data || err.message);
        }
      }

      const logs = await database.listDocuments(DATABASE_ID, WAITLOG_COLLECTION_ID, [
        Query.equal("category", slotType),
        Query.isNull("check_out"),
      ]);

      if (logs.documents.length > 0) {
        const log = logs.documents[0];
        const waitTime = Math.floor((now.getTime() - new Date(log.check_in).getTime()) / 60000);

        await database.updateDocument(DATABASE_ID, WAITLOG_COLLECTION_ID, log.$id, {
          check_out: isoTime,
          wait_time: waitTime,
        });

        const waitPayload = {
          slot_id: slotId,
          checkin_timestamp: log.check_in,
          checkout_timestamp: isoTime,
          day_of_week: dayOfWeek,
          slot_type: slotType,
          event_type: eventType,
          is_event_day: isEventDay,
          wait_time_minute: waitTime,
        };

        try {
          await axios.post(`${FLASK_SERVER_URL}/newdata`, waitPayload);
        } catch (err) {
          console.error("Flask Error (wait log):", err?.response?.data || err.message);
        }
      }
    }
  } catch (err) {
    console.error("Toggle slot error", err);
  }
};

const getDayInfo = (isoDate: string) => {
  const date = new Date(isoDate);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayOfWeek = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday" ? 1 : 0;
  return { dayOfWeek, isWeekend };
};

// ============================ 📅 EVENT FUNCTIONS ============================

export const createOrUpdateEvent = async (eventId: string | null, eventData: any) => {
  try {
    const dateStr = eventData.event_date;
    const existingEvents = await fetchEvents();
    const match = existingEvents.find((e: any) => e.event_date.split("T")[0] === dateStr);

    const targetId = eventId || match?.$id;

    if (targetId) {
      await database.updateDocument(DATABASE_ID, EVENT_COLLECTION_ID, targetId, eventData);
    } else {
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

// ============================ 🔐 AUTH & SESSION FUNCTIONS ============================

export const sendOtp = async (email: string): Promise<string> => {
  const token = await account.createEmailToken(ID.unique(), email);
  return token.userId;
};

export const verifyOtpAndRegister = async (
  userId: string,
  otp: string,
  email: string,
  username: string,
  password: string
) => {
  await account.createSession(userId, otp);

  const hashedPassword = SHA256(password).toString();

  await database.createDocument(DATABASE_ID, USERS_COLLECTION_ID, ID.unique(), {
    username,
    mail: email,
    password: hashedPassword,
    role: 'user',
  });
};

export const loginUser = async (email: string, password: string) => {
  const res = await database.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
    Query.equal('mail', [email]),
  ]);

  if (res.documents.length === 0) throw new Error('User not found');

  const user = res.documents[0];
  const hashedPassword = SHA256(password).toString();

  if (user.password !== hashedPassword) throw new Error('Incorrect password');

  return user;
};

export const getUserRoleFromSession = async (): Promise<string> => {
  try {
    const session = await account.get();
    const email = session.email;

    const userDocs = await database.listDocuments(DATABASE_ID, USERS_COLLECTION_ID);
    const user = userDocs.documents.find((doc) => doc.mail === email);

    return user?.role || "user";
  } catch (error) {
    throw new Error("No active session");
  }
};
