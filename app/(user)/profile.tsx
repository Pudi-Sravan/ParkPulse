import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fetchUserByEmail } from "@/services/appwrite";
import { useUser } from "@/context/userstore";

export default function Profile() {
  const navigation = useNavigation();
  const { email } = useUser(); 
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
console.log(email)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!email) throw new Error("Email not available in context");

        const user = await fetchUserByEmail(email);
        setUsername(user?.username ?? "Unknown User");
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [email]);

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "auth" as never }],
    });
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
