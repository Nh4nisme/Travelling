import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService, type AIMessage } from '@/services/aiService';
import { listingService } from '@/services/listingService';
import { bookingService } from '@/services/bookingService';
import type { Listing } from '@/types/listing';
import type { Booking } from '@/store/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 60;
const CHAT_WIDTH = 360;
const CHAT_HEIGHT = 600;

type AIChatBubbleProps = {
  /** Vị trí của bubble: 'draggable' (có thể kéo) hoặc 'top-right' (cố định 2/3 màn hình) */
  position?: 'draggable' | 'top-right';
  /** Vị trí ban đầu nếu là draggable (default: bottom-right) */
  initialPosition?: { x: number; y: number };
};

export function AIChatBubble({ 
  position = 'draggable',
  initialPosition = { x: SCREEN_WIDTH - BUBBLE_SIZE - 20, y: SCREEN_HEIGHT - BUBBLE_SIZE - 100 }
}: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<{ listings?: Listing[]; bookings?: Booking[] }>({});
  
  const scrollViewRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const chatScaleAnim = useRef(new Animated.Value(0)).current;
  
  // Draggable position
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Pan responder for draggable
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => position === 'draggable',
      onMoveShouldSetPanResponder: () => position === 'draggable',
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);
        
        // Snap to edges if dragged too far
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        
        let finalX = currentX;
        let finalY = currentY;
        
        // Keep within bounds
        if (currentX < 0) finalX = 10;
        if (currentX > SCREEN_WIDTH - BUBBLE_SIZE) finalX = SCREEN_WIDTH - BUBBLE_SIZE - 10;
        if (currentY < 0) finalY = 10;
        if (currentY > SCREEN_HEIGHT - BUBBLE_SIZE - 50) finalY = SCREEN_HEIGHT - BUBBLE_SIZE - 100;
        
        // Animate to final position
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }).start();
        
        // If it was a tap (not a drag), open chat
        if (Math.abs(gesture.dx) < 10 && Math.abs(gesture.dy) < 10) {
          setIsOpen(true);
        }
      },
    })
  ).current;

  // Animation khi mount
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  // Animation khi mở/đóng chat
  useEffect(() => {
    Animated.spring(chatScaleAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [isOpen]);

  // Load context khi mở chat lần đầu
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadContext();
      // Tin nhắn chào mừng
      const welcomeMsg = aiService.createMessage(
        'assistant',
        'Hello! 👋 I\'m your AI travel assistant. I can help you with:\n\n• Finding tours and accommodations\n• Booking questions\n• Payment and cancellation policies\n• General FAQs\n\nHow can I help you today?'
      );
      setMessages([welcomeMsg]);
    }
  }, [isOpen]);

  // Auto scroll khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadContext = async () => {
    try {
      // Load listings và bookings để AI có context
      const [listings, bookingsData] = await Promise.all([
        listingService.getAll().catch(() => []),
        bookingService.list().catch(() => ({ bookings: [] })),
      ]);
      setContext({
        listings,
        bookings: bookingsData.bookings || [],
      });
    } catch (err) {
      console.warn('Failed to load context:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check if API is configured
    if (!aiService.isConfigured()) {
      setError('AI chat is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your environment variables.');
      return;
    }

    const userMessage = aiService.createMessage('user', inputText.trim());
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.chat(userMessage.content, messages, context);
      const assistantMessage = aiService.createMessage('assistant', response);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    const welcomeMsg = aiService.createMessage(
      'assistant',
      'Chat cleared! How can I help you today?'
    );
    setMessages([welcomeMsg]);
  };

  // Calculate chat position based on bubble position
  const getChatPosition = () => {
    if (position === 'top-right') {
      // Fixed at 2/3 screen top-right
      return {
        top: SCREEN_HEIGHT / 3 - CHAT_HEIGHT / 2,
        right: 20,
      };
    }
    
    // For draggable, position chat near the bubble
    const bubbleX = (pan.x as any)._value;
    const bubbleY = (pan.y as any)._value;
    
    let chatX = bubbleX + BUBBLE_SIZE + 10;
    let chatY = bubbleY - (CHAT_HEIGHT - BUBBLE_SIZE) / 2;
    
    // If chat would go off screen right, place it on the left of bubble
    if (chatX + CHAT_WIDTH > SCREEN_WIDTH - 20) {
      chatX = bubbleX - CHAT_WIDTH - 10;
    }
    
    // Keep chat within vertical bounds
    if (chatY < 20) chatY = 20;
    if (chatY + CHAT_HEIGHT > SCREEN_HEIGHT - 20) chatY = SCREEN_HEIGHT - CHAT_HEIGHT - 20;
    
    return {
      left: chatX < 20 ? 20 : chatX,
      top: chatY,
    };
  };

  const bubblePositionStyle = position === 'top-right'
    ? { top: SCREEN_HEIGHT / 3 - BUBBLE_SIZE / 2, right: 20 }
    : {};

  if (!isOpen) {
    return (
      <Animated.View
        {...(position === 'draggable' ? panResponder.panHandlers : {})}
        style={[
          styles.bubble,
          position === 'draggable' 
            ? { 
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scaleAnim }
                ] 
              }
            : { ...bubblePositionStyle, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.bubbleButton,
            isDragging && styles.bubbleButtonDragging,
          ]}
          onPress={() => position !== 'draggable' && setIsOpen(true)}
          activeOpacity={0.8}
          disabled={position === 'draggable'} // Let pan responder handle it
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          {position === 'draggable' && !isDragging && (
            <View style={styles.dragHint}>
              <Ionicons name="move" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const chatPositionStyle = getChatPosition();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.chatContainer,
            chatPositionStyle,
            { transform: [{ scale: chatScaleAnim }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatWrapper}
          >
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>AI Assistant</Text>
                  <Text style={styles.headerSubtitle}>Always here to help</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleClearChat} style={styles.headerButton}>
                  <Ionicons name="refresh" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.assistantAvatar}>
                      <Ionicons name="sparkles" size={14} color="#fff" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      msg.role === 'user' ? styles.messageBubbleUser : styles.messageBubbleAssistant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === 'user' ? styles.messageTextUser : styles.messageTextAssistant,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View style={[styles.messageRow, styles.messageRowAssistant]}>
                  <View style={styles.assistantAvatar}>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                  </View>
                  <View style={[styles.messageBubble, styles.messageBubbleAssistant, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color="#666" />
                  </View>
                </View>
              )}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ff3b30" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask me anything..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    zIndex: 9999,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
  },
  bubbleButton: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bubbleButtonDragging: {
    backgroundColor: '#0051D5',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  dragHint: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  chatContainer: {
    position: 'absolute',
    width: CHAT_WIDTH,
    maxWidth: SCREEN_WIDTH - 40,
    height: CHAT_HEIGHT,
    maxHeight: SCREEN_HEIGHT - 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  chatWrapper: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleUser: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextAssistant: {
    color: '#000',
  },
  loadingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ff3b30',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    fontSize: 15,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
