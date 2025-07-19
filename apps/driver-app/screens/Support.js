import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Support() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Support / Help</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
}); 