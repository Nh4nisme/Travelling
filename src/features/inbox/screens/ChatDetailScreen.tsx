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
import { S, W } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { useInbox, InboxProvider, InboxContext } from '../context/InboxContext';
import { socketService } from '@/services/socketService';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

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
  const { colors, isDark } = useTheme();
  const { t, isVietnamese } = useLanguage();
  const convId = propConvId ?? route?.params?.conversationId ?? 'conv-1';
  const {
    conversations,
    sendMessage,
    typingMap,
    markAsRead,
    isHostUser,
    fetchMessages,
    refreshConversations,
  } = useInbox();

  const conv = conversations.find((item) => item.id === convId);

  // Nếu chưa tìm thấy conv (đang tải hoặc mới tạo từ listing), refresh lại
  useEffect(() => {
    if (!conv && convId && convId !== 'conv-1') {
      void refreshConversations();
    }
  }, [conv, convId, refreshConversations]);

  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const typingTimerRef = useRef<any>(null);

  const isPartnerTyping = conv ? Boolean(typingMap[conv.id]) : false;
  const messageList = useMemo(() => conv?.messages || [], [conv?.messages]);

  const suggestions = useMemo(() => {
    return isHostUser
      ? t.inbox.chat.hostSuggestions
      : t.inbox.chat.renterSuggestions;
  }, [isHostUser, t]);

  // 1. Tham gia phòng Socket.io của hội thoại này và tải tin nhắn từ Database
  useEffect(() => {
    if (!conv?.id) return;
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
  }, [conv?.id, fetchMessages, markAsRead, user?.id]);

  // 2. Cuộn mượt xuống cuối khi có tin nhắn mới hoặc đối phương đang gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [messageList.length, isPartnerTyping]);

  const handleBack = () => {
    if (user?.id && conv?.id) socketService.emitTypingStop(conv.id, user.id);
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  if (!conv) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
            paddingTop: insets.top,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 14, fontSize: 14, color: colors.muted }}>
          {t.common.connecting}
        </Text>
        <Pressable
          onPress={handleBack}
          style={{
            marginTop: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: colors.soft,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{t.common.cancel}</Text>
        </Pressable>
      </View>
    );
  }

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
        ? isVietnamese
          ? 'Đây là ảnh thực tế căn phòng:'
          : 'Here are the room check-in photos:'
        : isVietnamese
        ? 'Tôi gửi ảnh tham khảo căn hộ:'
        : 'Here is the photo of our room inquiry:',
      SAMPLE_ATTACHMENT
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Image source={{ uri: avatar(conv.hostAvatar) }} style={styles.headerAvatar} />

        <View style={{ flex: 1 }}>
          <View style={[S.row, { gap: 6 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {conv.hostName}
            </Text>
            {conv.role === 'Superhost' ? (
              <View
                style={[
                  styles.superhostBadge,
                  isDark && { backgroundColor: '#3D2800', borderColor: '#9E6400' },
                ]}
              >
                <Ionicons name="medal" size={11} color="#C47D00" />
                <Text style={styles.superhostText}>Superhost</Text>
              </View>
            ) : null}
            {conv.role === 'Verified Guest' ? (
              <View
                style={[
                  styles.guestBadge,
                  isDark && { backgroundColor: '#0E224A', borderColor: '#1E56C9' },
                ]}
              >
                <Ionicons name="checkmark-circle" size={11} color={colors.primary} />
                <Text
                  style={[styles.guestBadgeText, isDark && { color: '#93C5FD' }]}
                >
                  Guest
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {isPartnerTyping
              ? `✍️ ${t.inbox.chat.typing}`
              : conv.partnerPhone
              ? `Phone: ${conv.partnerPhone}`
              : isHostUser
              ? t.inbox.chat.directMessage
              : t.inbox.chat.typicallyReplies}
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
          <Ionicons name="information-circle-outline" size={24} color={colors.muted} />
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
              style={[
                styles.listingCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {conv.listingImage ? (
                <Photo uri={conv.listingImage} style={styles.listingThumb} />
              ) : (
                <View style={[styles.listingThumb, { backgroundColor: colors.soft }]} />
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: colors.text }} numberOfLines={1}>
                  {conv.listingTitle}
                </Text>
                {Boolean(conv.dates) ? (
                  <Text style={{ fontSize: 12, marginTop: 2, color: colors.muted }}>
                    {conv.dates}
                  </Text>
                ) : null}
                {Boolean(conv.listingPrice) ? (
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    <Text style={{ fontWeight: '700', color: colors.primary }}>
                      ${conv.listingPrice}
                    </Text>
                    <Text style={{ color: colors.muted }}> /{t.listing.night}</Text>
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ) : null}

          {/* Date separator */}
          <View style={styles.dateSeparator}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dateText, { color: colors.muted }]}>
              {t.inbox.chat.realtimeNotice}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Indicator khi đang tải tin nhắn */}
          {loadingMessages && messageList.length === 0 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : null}

          {/* Chưa từng chat: hiển thị empty state */}
          {!loadingMessages && messageList.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: colors.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="chatbubbles-outline" size={26} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                {t.inbox.chat.emptyHistory} {conv.hostName}
              </Text>
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 13, lineHeight: 18 }}>
                {t.inbox.chat.emptyHint}
              </Text>
            </View>
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
                    isSelf
                      ? [styles.bubbleRenter, { backgroundColor: colors.primary }]
                      : [styles.bubbleHost, { backgroundColor: colors.soft }],
                  ]}
                >
                  {Boolean(m.image) ? (
                    <Image source={{ uri: m.image }} style={styles.messageImage} resizeMode="cover" />
                  ) : null}
                  {Boolean(m.text) ? (
                    <Text
                      style={[
                        styles.msgText,
                        isSelf ? { color: '#fff' } : { color: colors.text },
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
                        : { color: colors.muted },
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
              <View style={[styles.bubble, styles.bubbleHost, { backgroundColor: colors.soft }, styles.typingBubble]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
                <Text style={[styles.typingText, { color: colors.muted }]}>
                  {conv.hostName} {t.inbox.chat.typing}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={[styles.suggestionsContainer, { borderTopColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {suggestions.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => void handleSelectSuggestion(s)}
                style={[styles.suggestionChip, { backgroundColor: colors.soft }]}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Chat Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <Pressable
            style={styles.attachBtn}
            hitSlop={8}
            onPress={() => void handleSendAttachment()}
          >
            <Ionicons name="image-outline" size={24} color={colors.muted} />
          </Pressable>

          <TextInput
            style={[styles.textInput, { backgroundColor: colors.soft, color: colors.text }]}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder={isVietnamese ? `Nhắn cho ${conv.hostName}...` : `Message ${conv.hostName}...`}
            placeholderTextColor={colors.muted}
            multiline
          />

          <Pressable
            onPress={() => void handleSend()}
            disabled={!inputText.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? colors.primary : colors.soft },
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? '#fff' : colors.muted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 12,
    padding: 10,
    gap: 12,
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
  },
  dateText: {
    fontSize: 11,
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
    marginBottom: 4,
  },
  bubble: {
    maxWidth: W * 0.74,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleHost: {
    borderBottomLeftRadius: 4,
  },
  bubbleRenter: {
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
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  attachBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
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
