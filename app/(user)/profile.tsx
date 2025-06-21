import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Client, Account, Databases, Query } from "react-native-appwrite";
import { useNavigation } from "@react-navigation/native";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "");

const account = new Account(client);
const database = new Databases(client);

const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

export default function Profile() {
  const navigation = useNavigation();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await account.get();
        const userEmail = session.email;

        const result = await database.listDocuments(DB_ID, COLLECTION_ID, [
          Query.equal("mail", [userEmail]),
        ]);

        const userDoc = result.documents[0];
        setUsername(userDoc?.username ?? "Unknown User");
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      navigation.reset({
        index: 0,
        routes: [{ name: "auth" as never }],
      });
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0D23", justifyContent: "center", alignItems: "center" }}>
      {loading ? (
        <ActivityIndicator size="large" color="#00FFFF" />
      ) : (
        <>
          <Text style={{ color: "#00FFFF", fontSize: 24, marginBottom: 20 }}>{username}</Text>
          <TouchableOpacity onPress={handleLogout} style={{ padding: 12, backgroundColor: "#00FFFF", borderRadius: 10 }}>
            <Text style={{ color: "#0F0D23", fontWeight: "bold" }}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
