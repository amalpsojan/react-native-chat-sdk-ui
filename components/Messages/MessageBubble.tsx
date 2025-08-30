import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { MessageType, Message as TMessage } from '../../types';
import type { MessageRenderers } from './Message';
import Message from './Message';
import MessageActionsMenu, { ActionItem } from './MessageActionsMenu';
import MetadataContainer from './MetadataContainer';

interface MessageBubbleProps {
  message: TMessage;
  prevMessage?: TMessage | null;
  nextMessage?: TMessage | null;
  messageRenderers?: MessageRenderers;
  onEditMessage?: (message: TMessage) => void;
  onDeleteMessageId?: (messageId: string) => void;
  onRetryMessage?: (message: TMessage) => void;
  onReplyMessage?: (message: TMessage) => void;
  lookupMessageById?: (id: string) => TMessage | undefined;
  onPressReplyJump?: (messageId: string) => void;
}

/**
 * MessageBubble - Renders a message bubble with appropriate styling
 * 
 * Handles bubble styling based on sender (left/right alignment)
 * and groups consecutive messages from the same sender
 */
const MessageBubble = memo(({ message, prevMessage, nextMessage, messageRenderers, onEditMessage, onDeleteMessageId, onRetryMessage, onReplyMessage, lookupMessageById, onPressReplyJump }: MessageBubbleProps) => {
  // Check if message has been edited
  const isEdited = !!message.editedAt;

  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  // Determine if message should be grouped with adjacent messages
  const isFirstInGroup = !prevMessage || prevMessage.isReceived !== message.isReceived;
  const isLastInGroup = !nextMessage || nextMessage.isReceived !== message.isReceived;

  // Calculate bubble styles based on grouping
  let bubbleGroupStyle;
  if (message.isReceived) {
    if (isFirstInGroup && isLastInGroup) {
      bubbleGroupStyle = styles.bubbleLeftSingle;
    } else if (isFirstInGroup) {
      bubbleGroupStyle = styles.bubbleLeftFirst;
    } else if (isLastInGroup) {
      bubbleGroupStyle = styles.bubbleLeftLast;
    } else {
      bubbleGroupStyle = styles.bubbleLeftMiddle;
    }
  } else {
    if (isFirstInGroup && isLastInGroup) {
      bubbleGroupStyle = styles.bubbleRightSingle;
    } else if (isFirstInGroup) {
      bubbleGroupStyle = styles.bubbleRightFirst;
    } else if (isLastInGroup) {
      bubbleGroupStyle = styles.bubbleRightLast;
    } else {
      bubbleGroupStyle = styles.bubbleRightMiddle;
    }
  }

  const bubbleBaseStyle = message.isReceived ? styles.bubbleLeft : styles.bubbleRight;

  // Add minimum width for reply messages to prevent narrow bubbles
  const hasReply = !!(message as any).referenceMessage;
  const bubbleStyle = hasReply ? [bubbleBaseStyle, styles.bubbleWithReply] : bubbleBaseStyle;

  const createdAt = useMemo(() => {
    if (isEdited && message.editedAt) {
      return typeof message.editedAt === 'number' ? message.editedAt : new Date(message.editedAt).getTime();
    }
    return typeof message.createdAt === 'number' ? message.createdAt : new Date(message.createdAt).getTime();
  }, [message.createdAt, message.editedAt, isEdited]);

  const handleDownload = useCallback(async (uri: string, suggestedName: string) => {
    try {
      const safeName = suggestedName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localUri = `${FileSystem.documentDirectory}${safeName}`;
      const info = await FileSystem.getInfoAsync(localUri);
      if (!info.exists) {
        const dl = FileSystem.createDownloadResumable(uri, localUri);
        await dl.downloadAsync();
      }
      Alert.alert('Downloaded', Platform.OS === 'ios' ? 'Saved to app documents.' : 'Saved to app files.');
    } catch (e) {
      Alert.alert('Error', 'Download failed.');
    }
  }, []);

  const handleShare = useCallback(async (uri: string, mimeType?: string) => {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Unavailable', 'Sharing is not available on this device.');
      return;
    }
    try {
      await Sharing.shareAsync(uri, mimeType ? { mimeType } : undefined);
    } catch (e) {
      Alert.alert('Error', 'Share failed.');
    }
  }, []);

  const buildActions = useCallback((): ActionItem[] => {
    const actions: ActionItem[] = [];

    // Reply (all types)
    if (onReplyMessage) {
      actions.push({ key: 'reply', label: 'Reply', icon: 'reply', onPress: () => onReplyMessage(message) });
    }

    // Copy (text only)
    if (message.type === MessageType.TEXT) {
      actions.push({
        key: 'copy',
        label: 'Copy',
        icon: 'content-copy',
        onPress: () => {
          const text = (message.content as any)?.text ?? '';
          if (text) Clipboard.setStringAsync(text);
        },
      });
    }

    // Media actions (download/share)
    if (
      message.type === MessageType.IMAGE ||
      message.type === MessageType.VIDEO ||
      message.type === MessageType.AUDIO ||
      message.type === MessageType.DOCUMENT ||
      message.type === MessageType.STICKER
    ) {
      let uri = '';
      let fileName = 'file';
      switch (message.type) {
        case MessageType.IMAGE:
          uri = (message.content as any).image;
          fileName = (message.content as any).caption || 'image.jpg';
          break;
        case MessageType.VIDEO:
          uri = (message.content as any).video;
          fileName = (message.content as any).caption || 'video.mp4';
          break;
        case MessageType.AUDIO:
          uri = (message.content as any).audio;
          fileName = 'audio.m4a';
          break;
        case MessageType.DOCUMENT:
          uri = (message.content as any).document;
          fileName = (message.content as any).fileName || 'document';
          break;
        case MessageType.STICKER:
          uri = (message.content as any).sticker;
          fileName = 'sticker.png';
          break;
      }

      actions.push({ key: 'download', label: 'Download', icon: 'download', onPress: () => handleDownload(uri, fileName) });
      actions.push({ key: 'share', label: 'Share', icon: 'share-variant', onPress: async () => {
        // Ensure local file for sharing on some platforms
        if (uri.startsWith('http')) {
          try {
            const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const local = `${FileSystem.documentDirectory}${safe}`;
            const info = await FileSystem.getInfoAsync(local);
            if (!info.exists) {
              const dl = FileSystem.createDownloadResumable(uri, local);
              await dl.downloadAsync();
            }
            await handleShare(local);
            return;
          } catch {}
        }
        await handleShare(uri);
      }});
    }

    // Edit/Delete (own messages)
    if (!message.isReceived) {
      if (message.type === MessageType.TEXT && onEditMessage) {
        actions.push({ key: 'edit', label: 'Edit', icon: 'pencil', onPress: () => onEditMessage(message) });
      }
      if (onDeleteMessageId) {
        actions.push({ key: 'delete', label: 'Delete', icon: 'trash-can-outline', onPress: () => onDeleteMessageId(message.id) });
      }
      if (message.status === 'failed' && onRetryMessage) {
        actions.push({ key: 'retry', label: 'Retry', icon: 'refresh', onPress: () => onRetryMessage(message) });
      }
    }

    return actions;
  }, [message, onEditMessage, onDeleteMessageId, onRetryMessage, onReplyMessage, handleDownload, handleShare]);

  // Long press gesture via new API
  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(350)
        .onStart(() => {
          runOnJS(openMenu)();
        }),
    [openMenu]
  );

  if (message.type === MessageType.SYSTEM) {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemContainer}>
          <Message message={message} messageRenderers={messageRenderers} />
        </View>
      </View>
    );
  }

  return (
    <>
      <MessageActionsMenu visible={menuVisible} onClose={closeMenu} actions={buildActions()} />
      <View style={[
        styles.messageRow,
        isFirstInGroup ? styles.messageRowFirst : styles.messageRowGrouped,
      ]}>
        <GestureDetector gesture={longPressGesture}>
          <View
            style={[
              styles.bubble,
              bubbleStyle,
              bubbleGroupStyle,
            ]}
          >
            <Message message={message} messageRenderers={messageRenderers} onPressReplyJump={onPressReplyJump}
            lookupMessageById={lookupMessageById}
            />
            <MetadataContainer
              isEdited={!!isEdited}
              createdAt={createdAt}
              isReceived={!!message.isReceived}
              status={message.status}
            />
          </View>
        </GestureDetector>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  messageRow: {
    width: '100%',
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  messageRowFirst: {
    marginTop: 8,
    marginBottom: 2,
  },
  messageRowGrouped: {
    marginTop: 1,
    marginBottom: 1,
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  bubbleWithReply: {
    minWidth: 200,
  },
  // Left side (received messages) - different border radius for grouping
  bubbleLeft: {
    backgroundColor: '#EDEDED',
    alignSelf: 'flex-start',
  },
  bubbleLeftSingle: {
    borderRadius: 18,
  },
  bubbleLeftFirst: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
  },
  bubbleLeftMiddle: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
  },
  bubbleLeftLast: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  // Right side (sent messages) - different border radius for grouping
  bubbleRight: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  bubbleRightSingle: {
    borderRadius: 18,
  },
  bubbleRightFirst: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleRightMiddle: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleRightLast: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  systemRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  systemContainer: {
    maxWidth: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MessageBubble; 