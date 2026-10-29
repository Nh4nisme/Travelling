import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '@/components';
import { c, S, W } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { CONVERSATIONS } from '../mockData';
import type { ChatMessage } from '../types';

const QUICK_SUGGESTIONS = [
  '🕑 What is the exact check-in time?',
  '📶 What is the wifi network & password?',
  '🚗 Is parking space available?',
  '🐾 Are pets allowed?',
];

interface ChatDetailScreenProps {
  route?: any;
  navigation?: any;
  conversationId?: string;
  onBack?: () => void;
}

export function ChatDetailScreen({
  route,
  navigation,
  conversationId: propConvId,
  onBack,
}: ChatDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const convId = propConvId ?? route?.params?.conversationId ?? 'conv-1';
  const conv = CONVERSATIONS.find((item) => item.id === convId) ?? CONVERSATIONS[0];

  const [messages, setMessages] = useState<ChatMessage[]>(conv.messages);
  const [inputText, setInputText] = useState('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'renter',
      text: inputText.trim(),
      time: 'Just now',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'renter',
      text: suggestion.replace(/^[^\s]+\s/, ''),
      time: 'Just now',
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header - Chống tai thỏ / Notch / Dynamic Island */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.t} />
        </Pressable>

        <Image source={{ uri: avatar(conv.hostAvatar) }} style={styles.headerAvatar} />

        <View style={{ flex: 1 }}>
          <View style={[S.row, { gap: 6 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.t }} numberOfLines={1}>
              {conv.hostName}
            </Text>
            {conv.role === 'Superhost' && (
              <View style={styles.superhostBadge}>
                <Ionicons name="medal" size={11} color="#C47D00" />
                <Text style={styles.superhostText}>Superhost</Text>
              </View>
            )}
          </View>
          <Text style={[S.muted, { fontSize: 12 }]}>
            {conv.role === 'Support Team' ? 'Customer Support 24/7' : 'Typically replies in 1 hr'}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={() => {
            if (conv.listingId && navigation?.navigate) {
              navigation.navigate('Detail', { id: conv.listingId });
            }
          }}
          style={styles.infoBtn}
        >
          <Ionicons name="information-circle-outline" size={24} color={c.m} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Pinned Listing Card (Airbnb style) */}
          {conv.listingTitle && (
            <Pressable
              onPress={() => {
                if (conv.listingId && navigation?.navigate) {
                  navigation.navigate('Detail', { id: conv.listingId });
                }
              }}
              style={styles.listingCard}
            >
              {conv.listingImage ? (
                <Photo uri={conv.listingImage} style={styles.listingThumb} />
              ) : (
                <View style={[styles.listingThumb, { backgroundColor: c.soft }]} />
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: c.t }} numberOfLines={1}>
                  {conv.listingTitle}
                </Text>
                {conv.dates && (
                  <Text style={[S.muted, { fontSize: 12, marginTop: 2 }]}>{conv.dates}</Text>
                )}
                {conv.listingPrice && (
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    <Text style={{ fontWeight: '700', color: c.p }}>${conv.listingPrice}</Text>
                    <Text style={S.muted}> / night</Text>
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.m} />
            </Pressable>
          )}

          {/* Date separator */}
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>Conversation with Host</Text>
            <View style={styles.dateLine} />
          </View>

          {/* Messages Stream */}
          {messages.map((m) => {
            const isRenter = m.sender === 'renter';
            return (
              <View
                key={m.id}
                style={[
                  styles.msgRow,
                  isRenter ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                ]}
              >
                {!isRenter && (
                  <Image source={{ uri: avatar(conv.hostAvatar) }} style={styles.bubbleAvatar} />
                )}
                <View
                  style={[
                    styles.bubble,
                    isRenter ? styles.bubbleRenter : styles.bubbleHost,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      isRenter ? { color: '#fff' } : { color: c.t },
                    ]}
                  >
                    {m.text}
                  </Text>
                  <Text
                    style={[
                      styles.msgTime,
                      isRenter
                        ? { color: 'rgba(255,255,255,0.75)', textAlign: 'right' }
                        : { color: c.m },
                    ]}
                  >
                    {m.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {QUICK_SUGGESTIONS.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSelectSuggestion(s)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Chat Input Bar - Chống vướng thanh gạt Home Indicator */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable style={styles.attachBtn}>
            <Ionicons name="image-outline" size={22} color={c.m} />
          </Pressable>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Message ${conv.hostName}...`}
            placeholderTextColor={c.m}
            multiline
          />

          <Pressable
            onPress={handleSend}
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? c.p : c.soft },
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? '#fff' : c.m}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: c.soft,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.soft,
  },
  superhostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FFE0A3',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  superhostText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9E6400',
  },
  infoBtn: {
    padding: 4,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.b,
    borderRadius: 12,
    padding: 10,
    gap: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  listingThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.soft,
  },
  dateText: {
    fontSize: 12,
    color: c.m,
    fontWeight: '500',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.soft,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: W * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleHost: {
    backgroundColor: c.soft,
    borderBottomLeftRadius: 4,
  },
  bubbleRenter: {
    backgroundColor: c.p,
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
  },
  suggestionsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: c.soft,
  },
  suggestionChip: {
    backgroundColor: c.soft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 12,
    color: c.t,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: c.soft,
    gap: 10,
    backgroundColor: '#fff',
  },
  attachBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: c.soft,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: c.t,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
