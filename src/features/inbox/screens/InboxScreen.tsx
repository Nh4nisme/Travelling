import React, { useState, useMemo, useCallback } from 'react';
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

function InboxMain() {
  const navigation = useNavigation<any>();
  const { conversations, markAsRead, unreadCount, isHostUser, createInquiry } = useInbox();
  const [activeTab, setActiveTab] = useState<ConversationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Modal chọn người để bắt đầu cuộc trò chuyện mới
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

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

  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    setLoadingContacts(true);
    try {
      const list = await chatService.getContacts();
      setContacts(list);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleStartChatWith = async (contact: ContactUser) => {
    setStartingChat(true);
    try {
      const convId = await createInquiry({
        hostId: contact.id,
        hostEmail: contact.email,
        title: 'Balian treehouse',
      });
      if (convId) {
        setShowNewChatModal(false);
        setSelectedConversationId(convId);
      }
    } catch (err) {
      console.error('Không thể bắt đầu chat:', err);
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
        onBack={() => setSelectedConversationId(null)}
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
              <Btn
                title={startingChat ? 'Connecting...' : 'Chat with Host Jinny Oslin'}
                icon="chatbubble-ellipses-outline"
                style={{ marginTop: 20 }}
                disabled={startingChat}
                onPress={handleDirectChatHost}
              />
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

      {/* Modal Bắt đầu cuộc trò chuyện mới */}
      <Modal
        visible={showNewChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.t }}>
                Start a Conversation
              </Text>
              <Pressable onPress={() => setShowNewChatModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={c.t} />
              </Pressable>
            </View>

            {loadingContacts ? (
              <ActivityIndicator size="small" color={c.p} style={{ marginVertical: 30 }} />
            ) : contacts.length === 0 ? (
              <Text style={[S.muted, { textAlign: 'center', marginVertical: 20 }]}>
                No contacts available.
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {contacts.map((contact) => (
                  <Pressable
                    key={contact.id}
                    style={[S.row, styles.contactItem]}
                    onPress={() => handleStartChatWith(contact)}
                    disabled={startingChat}
                  >
                    <Image source={{ uri: avatar(20) }} style={styles.contactAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: c.t }}>
                        {contact.name}
                      </Text>
                      <Text style={[S.muted, { fontSize: 13 }]}>{contact.email}</Text>
                    </View>
                    <Ionicons name="chatbubble-outline" size={20} color={c.p} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

export function InboxScreen() {
  return (
    <InboxProvider>
      <InboxMain />
    </InboxProvider>
  );
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
