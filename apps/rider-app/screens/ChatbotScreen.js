import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';

const mockMessages = [
  { id: '1', from: 'bot', text: 'Hi! How can I help you today?' },
  { id: '2', from: 'user', text: 'I have a question about my last ride.' },
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Customer Support</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.chatArea}
      />
      <View style={styles.inputBlockShadow}>
        <View style={styles.inputRowRedesigned}>
          <TextInput
            style={styles.inputRedesigned}
            placeholder="Type your message..."
            placeholderTextColor="#72809b"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="send" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
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
  chatArea: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#F2F4F7',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: Colors.text,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  sendBtn: {
    marginLeft: 8,
  },
  inputBlockShadow: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
    marginBottom: 0,
  },
  inputRowRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1f65',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 0,
  },
  inputRedesigned: {
    flex: 1,
    fontSize: 16,
    color: '#aeb4cf',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    fontFamily: Typography.fontFamily,
  },
}); 