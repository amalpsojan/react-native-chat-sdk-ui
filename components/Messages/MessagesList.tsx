import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Message } from "../../types";
import { isSameDay } from "../../utils/utils";
import DateSeparator from "../DateSeparator";
import type { MessageRenderers } from "./Message";
import MessageBubble from "./MessageBubble";

interface MessagesListProps {
  messages: Message[];
  currentUserId: string;
  onLoadEarlier?: () => void;
  messageRenderers?: MessageRenderers;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onRetryMessage?: (message: Message) => void;
  onReplyMessage?: (message: Message) => void;
}

/**
 * MessagesList - Renders the scrollable list of chat messages
 *
 * Handles message rendering, scrolling, and loading earlier messages
 */
const MessagesList = React.forwardRef<FlashList<Message>, MessagesListProps>(
  ({ messages, currentUserId, onLoadEarlier, messageRenderers, onEditMessage, onDeleteMessage, onRetryMessage, onReplyMessage }, ref) => {
    const lookupMessageById = useCallback((id: string) => messages.find(m => m.id === id), [messages]);
    const jumpToMessage = useCallback((id: string) => {
      const index = messages.findIndex(m => m.id === id);
      if (index >= 0) {
        const list = (ref as any)?.current as FlashList<Message> | undefined;
        list?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    }, [messages, ref]);

    const renderItem = useCallback(
      ({ item, index }: { item: Message; index: number }) => {
        // Get adjacent messages for grouping logic
        // Note: Since the list is inverted, we need to adjust the indices
        const prevMessage =
          index < messages.length - 1 ? messages[index + 1] : null;
        const nextMessage = index > 0 ? messages[index - 1] : null;

        // Show DateSeparator if this is the first message or a new day compared to previous message
        const showDateSeparator = !prevMessage || !isSameDay(item, prevMessage);

        return (
          <>
            {showDateSeparator && (
              <DateSeparator
                timestamp={
                  typeof item.createdAt === "number"
                    ? item.createdAt
                    : new Date(item.createdAt).getTime()
                }
              />
            )}

            <MessageBubble
              message={item}
              prevMessage={prevMessage}
              nextMessage={nextMessage}
              messageRenderers={messageRenderers}
              onDeleteMessageId={onDeleteMessage}
              onRetryMessage={onRetryMessage}
              onReplyMessage={onReplyMessage}
              lookupMessageById={lookupMessageById}
              onPressReplyJump={jumpToMessage}
            />
          </>
        );
      },
      [messages, currentUserId, messageRenderers, onDeleteMessage, onRetryMessage, onReplyMessage, lookupMessageById, jumpToMessage]
    );

    const keyExtractor = useCallback((item: Message) => item.id, []);

    const handleEndReached = useCallback(() => {
      if (onLoadEarlier) {
        onLoadEarlier();
      }
    }, [onLoadEarlier]);

    if (messages.length === 0) {
      return (
        <View style={styles.emptyList}>
          <Text>No messages yet</Text>
        </View>
      );
    }

    return (
      <FlashList
        ref={ref}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        inverted={true}
        estimatedItemSize={60}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={() => <View style={{ height: 20 }} />}
      />
    );
  }
);

const styles = StyleSheet.create({
  listContent: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessagesList;
