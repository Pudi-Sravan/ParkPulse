import { Client, Databases, ID, Query } from "react-native-appwrite";

// Appwrite constants
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const PARKING_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PARKING_COLLECTION_ID!;
const SAVED_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_COLLECTION_ID!;

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const database = new Databases(client);

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
  try {
    const res = await database.listDocuments(DATABASE_ID, PARKING_COLLECTION_ID, [
      Query.equal("Slotid", slotId),
    ]);

    if (res.documents.length > 0) {
      await database.updateDocument(DATABASE_ID, PARKING_COLLECTION_ID, res.documents[0].$id, {
        Vacancy: !currentStatus,
      });
    } else {
      await database.createDocument(DATABASE_ID, PARKING_COLLECTION_ID, ID.unique(), {
        slotId,
        Vacancy: !currentStatus,
      });
    }
  } catch (err) {
    console.error("Toggle slot error", err);
  }
};
