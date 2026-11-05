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
import { c, S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { ChatDetailScreen } from './ChatDetailScreen';
import { InboxProvider, useInbox } from '../context/InboxContext';
import { chatService, type ContactUser } from '@/services/chatService';
import type { ConversationStatus, Conversation } from '../types';

const TABS: { id: ConversationStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Bookings' },
  { id: 'inquiry', label: 'Inquiries' },
  { id: 'support', label: 'Support' },
];

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

  const handleDirectChatHost = async () => {
    setStartingChat(true);
    try {
      const convId = await createInquiry({
        hostEmail: 'jinny@gmail.com',
        title: 'Balian treehouse',
      });
      if (convId) {
        setSelectedConversationId(convId);
      }
    } catch (err) {
      console.error('Lỗi kết nối chủ nhà:', err);
    } finally {
      setStartingChat(false);
    }
  };

  const getStatusBadgeStyle = useCallback((status: Conversation['status']) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#E6FCFF', border: '#B5F5FC', text: '#00838F' };
      case 'inquiry':
        return { bg: '#FFF7E6', border: '#FFE0A3', text: '#9E6400' };
      case 'past':
        return { bg: '#F3F4F6', border: '#DADDE4', text: '#8A8F9C' };
      case 'support':
      default:
        return { bg: '#EFF4FE', border: '#C5D8FD', text: '#1E56C9' };
    }
  }, []);

  if (selectedConversationId) {
    return (
      <ChatDetailScreen
        conversationId={selectedConversationId}
        navigation={navigation}
        onBack={() => {
          setSelectedConversationId(null);
          try {
            navigation.setParams({ openConversationId: undefined, t: undefined });
          } catch {}
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
            <Text style={S.h1}>{isHostUser ? 'Host Inbox' : 'Inbox'}</Text>
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
                <Text style={styles.headerUnreadText}>{unreadCount} unread</Text>
              </View>
            ) : null}
            <Pressable
              style={styles.newChatBtn}
              onPress={handleOpenNewChat}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={22} color={c.p} />
            </Pressable>
          </View>
        </View>
        <Text style={[S.muted, { marginTop: 4 }]}>
          {isHostUser
            ? 'Guest inquiries & reservations for Balian Treehouse'
            : 'Messages with Hosts and 24/7 Support'}
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={c.m} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              isHostUser
                ? 'Search guest name, property or message...'
                : 'Search host, property or message...'
            }
            placeholderTextColor={c.m}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={c.m} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {TABS.map((tab) => {
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
                  active && { backgroundColor: c.p, borderColor: c.p },
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
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
            <Ionicons name="chatbubbles-outline" size={52} color={c.b} />
            <Text style={[{ fontSize: 18, fontWeight: '700', color: c.t }, { marginTop: 16, textAlign: 'center' }]}>
              No messages found
            </Text>
            <Text style={[S.muted, { marginTop: 6, textAlign: 'center' }]}>
              {searchQuery
                ? `No conversation matches "${searchQuery}"`
                : isHostUser
                ? 'When travelers inquire or book your property, messages will show here.'
                : 'When you inquire or book a place, your conversations will appear here.'}
            </Text>

            {!isHostUser ? (
              <View style={[S.row, { gap: 10, marginTop: 20 }]}>
                <Btn
                  title="Explore places"
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
                  pressed && { backgroundColor: c.soft },
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
                        style={[styles.hostName, item.unread && { fontWeight: '800' }]}
                        numberOfLines={1}
                      >
                        {item.hostName}
                      </Text>
                      {item.role === 'Superhost' ? (
                        <Ionicons name="medal" size={13} color="#C47D00" />
                      ) : null}
                      {item.role === 'Verified Guest' ? (
                        <Ionicons name="checkmark-circle" size={13} color={c.p} />
                      ) : null}
                    </View>
                    <Text style={[S.muted, { fontSize: 12 }]}>{item.lastMessageTime}</Text>
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
                        {item.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Row 3: Message preview */}
                  <Text
                    style={[
                      styles.lastMessage,
                      item.unread ? { color: c.t, fontWeight: '700' } : { color: c.m },
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={c.m}
                  style={{ alignSelf: 'center', marginLeft: 4 }}
                />
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
          <View style={styles.modalBox}>
            <View style={[S.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.t }}>
                  Start a Conversation
                </Text>
                <Text style={[S.muted, { fontSize: 13, marginTop: 4 }]}>
                  Find someone by phone number or email
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
                <Ionicons name="close" size={24} color={c.t} />
              </Pressable>
            </View>

            {/* Input tìm kiếm */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              <View style={[styles.searchBar, { flex: 1 }]}>
                <Ionicons name="search-outline" size={18} color={c.m} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter phone number or email..."
                  placeholderTextColor={c.m}
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
                    <Ionicons name="close-circle" size={18} color={c.m} />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={handleSearchUser}
                disabled={searchingUser || !searchUserQuery.trim()}
                style={{
                  backgroundColor: !searchUserQuery.trim() ? c.soft : c.p,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {searchingUser ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: !searchUserQuery.trim() ? c.m : '#fff', fontWeight: '700', fontSize: 14 }}>
                    Find
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Thông báo lỗi */}
            {searchUserError ? (
              <View style={{ backgroundColor: '#FFEBEA', borderColor: '#FFD3D1', borderWidth: 1, padding: 12, borderRadius: 10, marginVertical: 6 }}>
                <Text style={{ color: '#D9381E', fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                  {searchUserError}
                </Text>
              </View>
            ) : null}

            {/* Kết quả tìm kiếm tìm thấy */}
            {foundUser ? (
              <View style={{ marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <View style={[S.row, { alignItems: 'center' }]}>
                  <Image source={{ uri: avatar(20) }} style={styles.contactAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: c.t }}>
                      {foundUser.name}
                    </Text>
                    <Text style={[S.muted, { fontSize: 13, marginTop: 2 }]}>
                      {foundUser.email}{foundUser.phone ? ` · ${foundUser.phone}` : ''}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={{
                    marginTop: 14,
                    backgroundColor: c.p,
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
                      Start Chat
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : !searchUserError ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Ionicons name="shield-checkmark-outline" size={36} color={c.p} style={{ opacity: 0.7, marginBottom: 8 }} />
                <Text style={{ fontSize: 13, color: c.m, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
                  Booked travelers and hosts connect automatically.{'\n'}To chat with another member, enter their exact phone number or email address.
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
  // Lấy openConversationId và t từ route params (truyền từ DetailScreen khi bấm Contact Host)
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
    backgroundColor: '#eff6ff',
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
    backgroundColor: c.soft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: c.t,
    padding: 0,
  },
  tabsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: c.soft,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: c.soft,
    borderWidth: 1,
    borderColor: c.soft,
  },
  tabChipText: {
    fontSize: 13,
    color: c.t,
    fontWeight: '500',
  },
  convItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.soft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.soft,
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
    color: c.t,
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  contactItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.soft,
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.soft,
  },
});
