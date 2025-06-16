import React, { Component } from 'react'
import { Text, View } from 'react-native'

export class plan extends Component {
  render() {
    return (
    <View style={{ flex: 1, backgroundColor: "#0F0D23", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#00FFFF", fontSize: 20 }}>Plan</Text>
        </View>
    )
  }
}

export default plan
