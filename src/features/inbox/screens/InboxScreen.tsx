import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Btn } from '@/components';
import { S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { ChatDetailScreen } from './ChatDetailScreen';
import { useInbox } from '../context/InboxContext';
import { chatService, type ContactUser } from '@/services/chatService';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { ConversationStatus, Conversation } from '../types';

function InboxMain({
  openConversationId,
  navTimestamp,
}: {
  openConversationId?: string;
  navTimestamp?: number;
}) {
  const navigation = useNavigation<any>();
  const { conversations, markAsRead, unreadCount, isHostUser, createInquiry, refreshConversations } =
    useInbox();
  const { colors, isDark } = useTheme();
  const { t, isVietnamese } = useLanguage();

  const getDisplayStatusLabel = (label: string) => {
    if (!isVietnamese) return label;
    return label
      .replace(/^Inquiry/i, 'Tư vấn')
      .replace(/^Reserved/i, 'Đã đặt')
      .replace(/^Past stay/i, 'Chuyến đi trước')
      .replace(/^Official Support/i, 'Hỗ trợ chính thức');
  };

  const [activeTab, setActiveTab] = useState<ConversationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Modal tìm kiếm người dùng qua SĐT / Email (bảo mật, không lộ danh sách)
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<ContactUser | null>(null);
  const [searchUserError, setSearchUserError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const tabs: { id: ConversationStatus; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t.inbox.tabs.all },
      { id: 'confirmed', label: t.inbox.tabs.bookings },
      { id: 'inquiry', label: t.inbox.tabs.inquiries },
      { id: 'support', label: t.inbox.tabs.support },
    ],
    [t]
  );

  // Auto-open conversation nếu được navigate từ DetailScreen với openConversationId
  useEffect(() => {
    if (openConversationId) {
      void (async () => {
        await refreshConversations();
        markAsRead(openConversationId);
        setSelectedConversationId(openConversationId);
      })();
    }
  }, [openConversationId, navTimestamp, refreshConversations, markAsRead]);

  const filtered = useMemo(() => {
    return conversations.filter((item) => {
      const matchTab = activeTab === 'all' || item.status === activeTab;
      if (!matchTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchHost = item.hostName.toLowerCase().includes(q);
      const matchListing = (item.listingTitle ?? '').toLowerCase().includes(q);
      const matchMessage = item.lastMessage.toLowerCase().includes(q);
      return matchHost || matchListing || matchMessage;
    });
  }, [conversations, activeTab, searchQuery]);

  const handleSelectConv = useCallback(
    (id: string) => {
      markAsRead(id);
      setSelectedConversationId(id);
    },
    [markAsRead]
  );

  const handleOpenNewChat = () => {
    setSearchUserQuery('');
    setFoundUser(null);
    setSearchUserError(null);
    setShowNewChatModal(true);
  };

  const handleSearchUser = async () => {
    const q = searchUserQuery.trim();
    if (!q) {
      setSearchUserError('Please enter a phone number or email.');
      return;
    }
    setSearchingUser(true);
    setSearchUserError(null);
    setFoundUser(null);
    try {
      const u = await chatService.searchUser(q);
      if (u) {
        setFoundUser(u);
      } else {
        setSearchUserError('No user found with this phone number or email.');
      }
    } catch (err: any) {
      setSearchUserError(err?.message || 'No user found with this phone number or email.');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleStartChatWith = async (contact: ContactUser) => {
    setStartingChat(true);
    try {
      const convId = await createInquiry({
        hostId: contact.id,
        hostEmail: contact.email,
        title: 'Direct Chat',
      });
      if (convId) {
        setShowNewChatModal(false);
        setSelectedConversationId(convId);
      }
    } catch (err: any) {
      console.error('Không thể bắt đầu chat:', err);
      setSearchUserError(err?.message || 'Could not start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  const getStatusBadgeStyle = useCallback(
    (status: Conversation['status']) => {
      switch (status) {
        case 'confirmed':
          return isDark
            ? { bg: '#0A3338', border: '#00838F', text: '#80DEEA' }
            : { bg: '#E6FCFF', border: '#B5F5FC', text: '#00838F' };
        case 'inquiry':
          return isDark
            ? { bg: '#3D2800', border: '#9E6400', text: '#FFE0A3' }
            : { bg: '#FFF7E6', border: '#FFE0A3', text: '#9E6400' };
        case 'past':
          return isDark
            ? { bg: '#23272F', border: '#4B5563', text: '#9CA3AF' }
            : { bg: '#F3F4F6', border: '#DADDE4', text: '#8A8F9C' };
        case 'support':
        default:
          return isDark
            ? { bg: '#0E224A', border: '#1E56C9', text: '#93C5FD' }
            : { bg: '#EFF4FE', border: '#C5D8FD', text: '#1E56C9' };
      }
    },
    [isDark]
  );

  if (selectedConversationId) {
    return (
      <ChatDetailScreen
        conversationId={selectedConversationId}
        navigation={navigation}
        onBack={() => {
          setSelectedConversationId(null);
          void refreshConversations();
        }}
      />
    );
  }

  return (
    <Screen>
      {/* Title Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={[S.row, { justifyContent: 'space-between' }]}>
          <View style={[S.row, { gap: 8 }]}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
              {isHostUser ? t.inbox.hostInbox : t.inbox.title}
            </Text>
            {isHostUser ? (
              <View style={styles.hostRoleBadge}>
                <Ionicons name="home" size={12} color="#9E6400" />
                <Text style={styles.hostRoleText}>Host View</Text>
              </View>
            ) : null}
          </View>

          <View style={[S.row, { gap: 10 }]}>
            {unreadCount > 0 ? (
              <View style={styles.headerUnreadBadge}>
                <Text style={styles.headerUnreadText}>
                  {unreadCount} {t.inbox.unread}
                </Text>
              </View>
            ) : null}
            <Pressable
              style={[styles.newChatBtn, { backgroundColor: colors.soft }]}
              onPress={handleOpenNewChat}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
        <Text style={{ color: colors.muted, marginTop: 4, fontSize: 14 }}>
          {isHostUser ? t.inbox.hostSubtitle : t.inbox.subtitle}
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.soft }]}>
          <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              isHostUser ? t.inbox.searchGuestPlaceholder : t.inbox.searchPlaceholder
            }
            placeholderTextColor={colors.muted}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsContainer, { borderColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const count = conversations.filter(
              (item) => tab.id === 'all' || item.status === tab.id
            ).length;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabChip,
                  { backgroundColor: colors.soft, borderColor: colors.border },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    { color: colors.muted },
                    active && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  {tab.label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Conversation List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={52} color={colors.border} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.text,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {t.inbox.noMessages}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6, textAlign: 'center', fontSize: 14 }}>
              {searchQuery
                ? `No conversation matches "${searchQuery}"`
                : isHostUser
                ? 'When travelers inquire or book your property, messages will show here.'
                : 'When you inquire or book a place, your conversations will appear here.'}
            </Text>

            {!isHostUser ? (
              <View style={[S.row, { gap: 10, marginTop: 20 }]}>
                <Btn
                  title={t.tabs.search}
                  icon="search-outline"
                  onPress={() => navigation.navigate('Search')}
                />
                <Btn
                  title="New message"
                  icon="create-outline"
                  outline
                  onPress={handleOpenNewChat}
                />
              </View>
            ) : null}
          </View>
        ) : (
          filtered.map((item) => {
            const badgeStyle = getStatusBadgeStyle(item.status);
            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectConv(item.id)}
                style={({ pressed }) => [
                  styles.convItem,
                  { borderBottomColor: colors.border },
                  pressed && { backgroundColor: colors.soft },
                ]}
              >
                {/* Avatar with unread badge */}
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: avatar(item.hostAvatar) }} style={styles.avatar} />
                  {item.unread ? <View style={styles.unreadDot} /> : null}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  {/* Row 1: Name + Time */}
                  <View style={S.between}>
                    <View style={[S.row, { gap: 6, flex: 1, paddingRight: 8 }]}>
                      <Text
                        style={[
                          styles.hostName,
                          { color: colors.text },
                          item.unread && { fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.hostName}
                      </Text>
                      {item.role === 'Superhost' ? (
                        <Ionicons name="medal" size={13} color="#C47D00" />
                      ) : null}
                      {item.role === 'Verified Guest' ? (
                        <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                      ) : null}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {item.lastMessageTime}
                    </Text>
                  </View>

                  {/* Row 2: Status tag / listing title */}
                  <View style={[S.row, { gap: 8, marginTop: 4 }]}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                        {getDisplayStatusLabel(item.statusLabel)}
                      </Text>
                    </View>

                    {item.listingPrice ? (
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        ${item.listingPrice}/{t.listing.night}
                      </Text>
                    ) : null}
                  </View>

                  {/* Row 3: Last Message snippet */}
                  <Text
                    style={[
                      styles.lastMessage,
                      { color: item.unread ? colors.text : colors.muted },
                      item.unread && { fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Modal Bắt đầu cuộc trò chuyện mới qua SĐT / Email */}
      <Modal
        visible={showNewChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.dialogBg }]}>
            <View
              style={[
                S.row,
                { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  {t.inbox.startConversation}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                  {t.inbox.findHelp}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowNewChatModal(false);
                  setSearchUserQuery('');
                  setFoundUser(null);
                  setSearchUserError(null);
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Input tìm kiếm */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              <View style={[styles.searchBar, { flex: 1, backgroundColor: colors.soft }]}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.muted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t.inbox.enterQuery}
                  placeholderTextColor={colors.muted}
                  value={searchUserQuery}
                  onChangeText={(text) => {
                    setSearchUserQuery(text);
                    setSearchUserError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="search"
                  onSubmitEditing={handleSearchUser}
                />
                {searchUserQuery.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setSearchUserQuery('');
                      setFoundUser(null);
                      setSearchUserError(null);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={handleSearchUser}
                disabled={searchingUser || !searchUserQuery.trim()}
                style={{
                  backgroundColor: !searchUserQuery.trim() ? colors.soft : colors.primary,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {searchingUser ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: !searchUserQuery.trim() ? colors.muted : '#fff',
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    {t.common.find}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Thông báo lỗi */}
            {searchUserError ? (
              <View
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.danger,
                  borderWidth: 1,
                  padding: 12,
                  borderRadius: 10,
                  marginVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 13,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}
                >
                  {searchUserError}
                </Text>
              </View>
            ) : null}

            {/* Kết quả tìm kiếm tìm thấy */}
            {foundUser ? (
              <View
                style={{
                  marginTop: 8,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.soft,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={[S.row, { alignItems: 'center' }]}>
                  <Image source={{ uri: avatar(20) }} style={styles.contactAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                      {foundUser.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {foundUser.email}
                      {foundUser.phone ? ` · ${foundUser.phone}` : ''}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={{
                    marginTop: 14,
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleStartChatWith(foundUser)}
                  disabled={startingChat}
                >
                  {startingChat ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                      {isVietnamese ? 'Bắt đầu trò chuyện' : 'Start Chat'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : !searchUserError ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={36}
                  color={colors.primary}
                  style={{ opacity: 0.7, marginBottom: 8 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    textAlign: 'center',
                    lineHeight: 18,
                    paddingHorizontal: 16,
                  }}
                >
                  {t.inbox.autoConnectNote}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

export function InboxScreen({ route }: any) {
  const openConversationId: string | undefined = route?.params?.openConversationId;
  const navTimestamp: number | undefined = route?.params?.t;
  return <InboxMain openConversationId={openConversationId} navTimestamp={navTimestamp} />;
}

const styles = StyleSheet.create({
  headerUnreadBadge: {
    backgroundColor: '#FFEBEA',
    borderColor: '#FFD3D1',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'center',
  },
  headerUnreadText: {
    color: '#D9381E',
    fontSize: 12,
    fontWeight: '700',
  },
  hostRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FFE0A3',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'center',
  },
  hostRoleText: {
    color: '#9E6400',
    fontSize: 11,
    fontWeight: '700',
  },
  newChatBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  tabsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 13,
  },
  convItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostName: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  contactItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
