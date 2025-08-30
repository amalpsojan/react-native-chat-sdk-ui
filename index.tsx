import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import InputToolbar from './components/InputToolbar/InputToolbar';
import MessagesList from './components/Messages/MessagesList';
import { ChatWindowProps, Message } from './types';

/**
 * ChatWindow - Main chat UI component
 * 
 * Combines MessagesList and InputToolbar into a complete chat interface
 */
const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onLoadEarlier,
  messageRenderers,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onReplyMessage,
}) => {
  const listRef = useRef<FlashList<Message>>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleReply = useCallback((m: Message) => {
    setReplyTo(m);
    if (onReplyMessage) onReplyMessage(m);
  }, [onReplyMessage]);

  const handleCancelReply = useCallback(() => setReplyTo(null), []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.messagesContainer}>
        <MessagesList
          ref={listRef}
          messages={messages}
          currentUserId={currentUserId}
          onLoadEarlier={onLoadEarlier}
          messageRenderers={messageRenderers}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onRetryMessage={onRetryMessage}
          onReplyMessage={handleReply}
        />
      </View>
      <InputToolbar
        onSendMessage={onSendMessage}
        onScrollToBottom={scrollToBottom}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  messagesContainer: {
    flex: 1,
  },
});

export default ChatWindow; 