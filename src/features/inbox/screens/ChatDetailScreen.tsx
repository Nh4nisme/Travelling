import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '@/components';
import { c, S, W } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { RENTER_CONVERSATIONS } from '../mockData';
import { useInbox, InboxProvider, InboxContext } from '../context/InboxContext';
import { socketService } from '@/services/socketService';
import { useApp } from '@/store/AppContext';

const RENTER_SUGGESTIONS = [
  '🕑 What is the exact check-in time?',
  '📶 What is the wifi network & password?',
  '🚗 Is parking space available?',
  '🐾 Are pets allowed?',
  '🍳 Can I cook in the kitchen?',
  '💰 Do you offer any discount?',
];

const HOST_SUGGESTIONS = [
  '🕑 Standard check-in is at 14:00. Welcome!',
  '📶 Wifi: Travelling_Guest, Pass: welcome2026',
  '🚗 Free private parking is available on premises',
  '🐾 Small pets under 10kg are warmly welcome',
  '🍳 Kitchen is fully equipped for cooking',
];

const SAMPLE_ATTACHMENT = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

interface ChatDetailScreenProps {
  route?: any;
  navigation?: any;
  conversationId?: string;
  onBack?: () => void;
}

function ChatDetailInner({
  route,
  navigation,
  conversationId: propConvId,
  onBack,
}: ChatDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const convId = propConvId ?? route?.params?.conversationId ?? 'conv-1';
  const { conversations, sendMessage, typingMap, markAsRead, isHostUser, fetchMessages } =
    useInbox();

  const conv =
    conversations.find((item) => item.id === convId) ??
    conversations[0] ??
    RENTER_CONVERSATIONS[0];
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const typingTimerRef = useRef<any>(null);

  const isPartnerTyping = Boolean(typingMap[conv.id]);
  const messageList = useMemo(() => conv.messages || [], [conv.messages]);

  const suggestions = useMemo(() => {
    return isHostUser ? HOST_SUGGESTIONS : RENTER_SUGGESTIONS;
  }, [isHostUser]);

  // 1. Tham gia phòng Socket.io của hội thoại này và tải tin nhắn từ Database
  useEffect(() => {
    let active = true;
    socketService.joinConversation(conv.id);

    (async () => {
      setLoadingMessages(true);
      await fetchMessages(conv.id);
      if (active) setLoadingMessages(false);
    })();
    markAsRead(conv.id);

    return () => {
      active = false;
      if (user?.id) socketService.emitTypingStop(conv.id, user.id);
      socketService.leaveConversation(conv.id);
    };
  }, [conv.id, fetchMessages, markAsRead, user?.id]);

  // 2. Cuộn mượt xuống cuối khi có tin nhắn mới hoặc đối phương đang gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [messageList.length, isPartnerTyping]);

  const handleBack = () => {
    if (user?.id) socketService.emitTypingStop(conv.id, user.id);
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (user?.id) {
      if (text.trim().length > 0) {
        socketService.emitTypingStart(conv.id, user.id, user.name || 'User');
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          socketService.emitTypingStop(conv.id, user.id);
        }, 2000);
      } else {
        socketService.emitTypingStop(conv.id, user.id);
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    if (user?.id) socketService.emitTypingStop(conv.id, user.id);
    await sendMessage(conv.id, textToSend);
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    const cleanText = suggestion.replace(/^[^\s]+\s/, '');
    await sendMessage(conv.id, cleanText);
  };

  const handleSendAttachment = async () => {
    await sendMessage(
      conv.id,
      isHostUser
        ? 'Here are the room check-in photos:'
        : 'Here is the photo of our room inquiry:',
      SAMPLE_ATTACHMENT
    );
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
            {conv.role === 'Superhost' ? (
              <View style={styles.superhostBadge}>
                <Ionicons name="medal" size={11} color="#C47D00" />
                <Text style={styles.superhostText}>Superhost</Text>
              </View>
            ) : null}
            {conv.role === 'Verified Guest' ? (
              <View style={styles.guestBadge}>
                <Ionicons name="checkmark-circle" size={11} color={c.p} />
                <Text style={styles.guestBadgeText}>Guest</Text>
              </View>
            ) : null}
          </View>
          <Text style={[S.muted, { fontSize: 12 }]}>
            {isPartnerTyping
              ? '✍️ Typing a reply...'
              : conv.partnerPhone
              ? `Phone: ${conv.partnerPhone}`
              : isHostUser
              ? 'Direct guest message'
              : 'Typically replies in a few minutes'}
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
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Pinned Listing Card (Airbnb style) */}
          {Boolean(conv.listingTitle) ? (
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
                {Boolean(conv.dates) ? (
                  <Text style={[S.muted, { fontSize: 12, marginTop: 2 }]}>{conv.dates}</Text>
                ) : null}
                {Boolean(conv.listingPrice) ? (
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    <Text style={{ fontWeight: '700', color: c.p }}>${conv.listingPrice}</Text>
                    <Text style={S.muted}> / night</Text>
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.m} />
            </Pressable>
          ) : null}

          {/* Date separator */}
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>Realtime Database Message · MongoDB Atlas</Text>
            <View style={styles.dateLine} />
          </View>

          {/* Indicator khi đang tải tin nhắn */}
          {loadingMessages && messageList.length === 0 ? (
            <ActivityIndicator size="small" color={c.p} style={{ marginVertical: 20 }} />
          ) : null}

          {/* Messages Stream */}
          {messageList.map((m) => {
            const isSelf = isHostUser ? m.sender === 'host' : m.sender === 'renter';
            return (
              <View
                key={m.id}
                style={[
                  styles.msgRow,
                  isSelf ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                ]}
              >
                {!isSelf ? (
                  <Image source={{ uri: avatar(conv.hostAvatar) }} style={styles.bubbleAvatar} />
                ) : null}
                <View
                  style={[
                    styles.bubble,
                    isSelf ? styles.bubbleRenter : styles.bubbleHost,
                  ]}
                >
                  {/* Nếu tin nhắn có hình ảnh */}
                  {Boolean(m.image) ? (
                    <Image
                      source={{ uri: m.image }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  {Boolean(m.text) ? (
                    <Text
                      style={[
                        styles.msgText,
                        isSelf ? { color: '#fff' } : { color: c.t },
                      ]}
                    >
                      {m.text}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.msgTime,
                      isSelf
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

          {/* Hiệu ứng Đối tác đang gõ phản hồi */}
          {isPartnerTyping ? (
            <View style={[styles.msgRow, { justifyContent: 'flex-start' }]}>
              <Image source={{ uri: avatar(conv.hostAvatar) }} style={styles.bubbleAvatar} />
              <View style={[styles.bubble, styles.bubbleHost, styles.typingBubble]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={c.p} />
                <Text style={styles.typingText}>{conv.hostName} is typing...</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {suggestions.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => void handleSelectSuggestion(s)}
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
          <Pressable
            style={styles.attachBtn}
            hitSlop={8}
            onPress={() => void handleSendAttachment()}
          >
            <Ionicons name="image-outline" size={24} color={c.m} />
          </Pressable>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder={`Message ${conv.hostName}...`}
            placeholderTextColor={c.m}
            multiline
          />

          <Pressable
            onPress={() => void handleSend()}
            disabled={!inputText.trim()}
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

// Bọc an toàn không vi phạm quy tắc Hooks
export function ChatDetailScreen(props: ChatDetailScreenProps) {
  const context = useContext(InboxContext);
  if (!context) {
    return (
      <InboxProvider>
        <ChatDetailInner {...props} />
      </InboxProvider>
    );
  }
  return <ChatDetailInner {...props} />;
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
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF4FE',
    borderWidth: 1,
    borderColor: '#C5D8FD',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E56C9',
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
    fontSize: 11,
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
    maxWidth: W * 0.74,
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
  messageImage: {
    width: W * 0.62,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingText: {
    fontSize: 12,
    color: c.m,
    fontStyle: 'italic',
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
