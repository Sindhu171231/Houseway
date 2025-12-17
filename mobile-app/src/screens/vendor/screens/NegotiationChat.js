import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import theme from '../../../styles/theme';
import { quotationsAPI } from '../../../utils/api';

export default function NegotiationChat({ route, navigation }) {
  const { quotationId } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => { 
    loadQuotation(); 
  }, []);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const res = await quotationsAPI.getQuotationById(quotationId);
      if (res.success) {
        setQuotation(res.data.quotation);
        // Transform quotation notes/communications to chat messages
        const chatMessages = (res.data.quotation.notes || []).map(note => ({
          id: note._id,
          from: note.author._id === res.data.quotation.vendor._id ? 'vendor' : 'client',
          text: note.content,
          ts: new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      Alert.alert('Error', 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    
    try {
      console.log('[NegotiationChat] Sending note to quotation:', quotationId, 'Content:', text);
      
      // Add note to quotation (NOT creating new quotation)
      const res = await quotationsAPI.addNote(quotationId, text.trim());
      console.log('[NegotiationChat] Note added response:', res);
      
      if (res.success) {
        // Add to local messages for immediate display
        const newMessage = {
          id: res.data.note?._id || Date.now().toString(),
          from: 'vendor',
          text: text.trim(),
          ts: 'Now'
        };
        setMessages(prev => [...prev, newMessage]);
        setText('');
        
        // Reload to sync with server
        setTimeout(() => loadQuotation(), 500);
      } else {
        Alert.alert('Error', res.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('[NegotiationChat] Error sending message:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send message';
      Alert.alert('Error', errorMsg);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary }}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Button and Centered Title */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {quotation?.title ? `Quotation for ${quotation.title.replace('Quotation for ', '')}` : 'Negotiation Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>Price Negotiation</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Quotation Info', 
            `Status: ${quotation?.status || 'N/A'}\nTotal: $${quotation?.totalAmount?.toFixed(2) || '0.00'}`
          )}
          activeOpacity={0.7}
        >
          <Feather name="info" size={20} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>
      
      {/* Messages List */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item, index }) => (
            <MessageBubble item={item} index={index} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={64} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>Start the negotiation by sending a message</Text>
              <Text style={styles.emptySubtext}>Discuss pricing, terms, or ask questions about this quotation</Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      {/* Input Row */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput 
            placeholder="Type your message or offer..." 
            value={text} 
            onChangeText={setText} 
            style={styles.input} 
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.send, !text.trim() && styles.sendDisabled]} 
            onPress={send}
            disabled={!text.trim()}
            activeOpacity={0.7}
          >
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const MessageBubble = ({ item, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 5,
        delay: index * 50,
        useNativeDriver: true,
      })
    ]).start();
  }, [opacity, scale, index]);

  return (
    <Animated.View 
      style={[
        styles.bubble, 
        item.from === 'vendor' ? styles.right : styles.left,
        {
          opacity,
          transform: [{ scale }],
        }
      ]}
    >
      <Text style={[styles.messageText, item.from === 'vendor' && styles.messageTextVendor]}>
        {item.text}
      </Text>
      <Text style={[styles.timestamp, item.from === 'vendor' && styles.timestampVendor]}>
        {item.ts}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  infoButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  bubble: {
    padding: 16,
    borderRadius: 20,
    marginVertical: 6,
    maxWidth: '80%',
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  left: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  right: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary[500],
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  messageText: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  messageTextVendor: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 8,
    textAlign: 'right',
  },
  timestampVendor: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    padding: 16,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: theme.colors.background.primary,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  send: {
    marginLeft: 12,
    backgroundColor: theme.colors.primary[500],
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.neutral[400],
  },
});