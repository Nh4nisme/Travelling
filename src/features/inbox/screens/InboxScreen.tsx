import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { c, S } from '@/constants/theme';
import { avatar } from '@/data/reviews';
import { CONVERSATIONS } from '../mockData';
import { ChatDetailScreen } from './ChatDetailScreen';
import type { ConversationStatus, Conversation } from '../types';

const TABS: { id: ConversationStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Bookings' },
  { id: 'inquiry', label: 'Inquiries' },
  { id: 'support', label: 'Support' },
];

export function InboxScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ConversationStatus>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Mở màn hình chat chi tiết với Safe View chống tai thỏ
  if (selectedConversationId) {
    return (
      <ChatDetailScreen
        conversationId={selectedConversationId}
        navigation={navigation}
        onBack={() => setSelectedConversationId(null)}
      />
    );
  }

  const filtered = CONVERSATIONS.filter((item) => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  const getStatusBadgeStyle = (status: Conversation['status']) => {
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
  };

  return (
    <Screen>
      {/* Title - Đã được Screen (SafeAreaView) bảo vệ chống tai thỏ */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={S.h1}>Inbox</Text>
        <Text style={[S.muted, { marginTop: 4 }]}>
          Messages with Airbnb hosts and support
        </Text>
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
                  {tab.label}
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
            <Ionicons name="chatbubbles-outline" size={48} color={c.b} />
            <Text style={[S.muted, { marginTop: 12 }]}>No messages in this folder</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const badgeStyle = getStatusBadgeStyle(item.status);
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedConversationId(item.id)}
                style={({ pressed }) => [
                  styles.convItem,
                  pressed && { backgroundColor: c.soft },
                ]}
              >
                {/* Avatar with unread badge */}
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: avatar(item.hostAvatar) }} style={styles.avatar} />
                  {item.unread && <View style={styles.unreadDot} />}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  {/* Row 1: Name + Time */}
                  <View style={S.between}>
                    <View style={[S.row, { gap: 6 }]}>
                      <Text style={[styles.hostName, item.unread && { fontWeight: '800' }]}>
                        {item.hostName}
                      </Text>
                      {item.role === 'Superhost' && (
                        <Ionicons name="medal" size={13} color="#C47D00" />
                      )}
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
                      item.unread ? { color: c.t, fontWeight: '600' } : { color: c.m },
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: c.soft,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: c.b,
  },
  tabChipText: {
    fontSize: 13,
    color: c.t,
    fontWeight: '500',
  },
  convItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: c.soft,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: c.soft,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: c.p,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: c.t,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
