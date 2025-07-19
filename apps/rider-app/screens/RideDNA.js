import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const stats = [
  { icon: 'moon-outline', title: 'Night Owl Rider', value: '60%', desc: 'You ride mostly at night.' },
  { icon: 'sunny-outline', title: 'Daytime Rider', value: '40%', desc: 'You ride during the day.' },
  { icon: 'star-outline', title: '5-Star Rider', value: '98%', desc: 'Your rides are highly rated.' },
];

export default function RideDNA() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Ride DNA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cards}>
        {stats.map((s, i) => (
          <Card key={i} style={styles.statCard} left={<Ionicons name={s.icon} size={28} color={Colors.primary} />}>
            <Text style={styles.statTitle}>{s.title}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statDesc}>{s.desc}</Text>
          </Card>
        ))}
        <Card style={styles.statCard} left={<Ionicons name="share-social-outline" size={28} color={Colors.primary} />}>
          <Text style={styles.statTitle}>Share Your Ride DNA</Text>
          <Button title="Share" icon="share-social" onPress={() => {}} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 32,
  },
  header: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  cards: {
    flexGrow: 0,
  },
  statCard: {
    width: 220,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  statTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: 6,
  },
  statValue: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 2,
  },
  statDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
    textAlign: 'center',
  },
}); 