import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Rides() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rides (Ride Management)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
}); 