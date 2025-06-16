import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

type VehicleType = 'car' | 'bike' | 'abled';

const vehicleTypes: VehicleType[] = ['car', 'bike', 'abled'];

const slotData: Record<VehicleType, boolean[]> = {
  car: [true, false, true],
  bike: [false, true],
  abled: [false],
};

const vehicleIcon: Record<VehicleType, any> = {
  car: require('../../assets/images/icons8-car-64.png'),
  bike: require('../../assets/images/icons8-car-64.png'),
  abled: require('../../assets/images/icons8-car-64.png'),
};

const UserHome = () => {
  const [selectedType, setSelectedType] = useState<VehicleType>('car');

  return (
    <View  style={{ flex: 1, backgroundColor: "#0F0D23", justifyContent: "center", alignItems: "center" }}>
      <Text className="text-xl font-bold text-center mb-4">Walmart - San Jose Branch</Text>

      {/* Vehicle Selector */}
      <View className="flex-row justify-around mb-6">
        {vehicleTypes.map((type) => (
          <TouchableOpacity key={type} onPress={() => setSelectedType(type)}>
            <View className={`p-3 rounded-full ${selectedType === type ? 'bg-blue-200' : 'bg-gray-200'}`}>
              <Image source={vehicleIcon[type]} style={{ width: 40, height: 40 }} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parking Slots */}
      <View className="flex-wrap flex-row justify-center items-center gap-4">
        {slotData[selectedType].map((occupied, idx) => (
          <View key={idx} className="w-24 h-32 border-2 border-gray-300 rounded-xl flex justify-center items-center bg-gray-100">
            {occupied ? (
              <Image source={vehicleIcon[selectedType]} style={{ width: 40, height: 40 }} />
            ) : (
              <Text className="text-gray-500">Empty</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default UserHome;
