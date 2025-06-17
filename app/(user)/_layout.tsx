import { Tabs } from "expo-router";
import { View, Image } from "react-native";
import { icons } from "@/constants/icons";

function TabIcon({ focused, icon }: any) {
    return (
        <View
            style={[
                {
                    justifyContent: "center",
                    alignItems: "center",
                },
            ]}
        >
            <Image
                source={icon}
                style={{
                    width: 30,       
                    height: 30,
                    tintColor: focused ? "#00FFFF" : "#A8B5DB", 
                }}
            />
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    justifyContent: "center",
                    alignItems: "center",
                    height: 50,
                    marginTop: 5,
                },
                tabBarStyle: {
                    backgroundColor: "#0F0D23",
                    borderRadius: 50,
                    marginHorizontal: 20,
                    marginBottom: 36,
                    height: 50,
                    position: "absolute",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "#00FFFF33",
                    shadowColor: "#00FFFF",
                    shadowOffset: { width: 0, height: 0 },   
                    shadowOpacity: 0.08,                    
                    shadowRadius: 4,
                    elevation: 3,                            
                },
            }}
        >
            <Tabs.Screen
                name="UserHome"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.home} />
                    ),
                }}
            />
            <Tabs.Screen
                name="plan"
                options={{
                    title: "Plan",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.plan} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.profile} />
                    ),
                }}
            />
        </Tabs>
    );
}
