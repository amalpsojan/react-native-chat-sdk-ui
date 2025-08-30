import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioContent, DocumentContent, ImageContent, MessageType, StickerContent, SystemContent, TextContent, Message as TMessage, VideoContent } from '../../types';
import { MessageAudio, MessageDocument, MessageImage, MessageSticker, MessageSystem, MessageText, MessageVideo } from './MessageTypes';

export type MessageRenderers = {
  [MessageType.TEXT]?: (content: TextContent) => React.ReactElement;
  [MessageType.SYSTEM]?: (content: SystemContent) => React.ReactElement;
  [MessageType.IMAGE]?: (content: ImageContent) => React.ReactElement;
  [MessageType.VIDEO]?: (content: VideoContent) => React.ReactElement;
  [MessageType.AUDIO]?: (content: AudioContent) => React.ReactElement;
  [MessageType.DOCUMENT]?: (content: DocumentContent) => React.ReactElement;
  [MessageType.STICKER]?: (content: StickerContent) => React.ReactElement;
};

interface MessageProps {
  message: TMessage;
  messageRenderers?: MessageRenderers;
  onPressReplyJump?: (messageId: string) => void;
  lookupMessageById?: (id: string) => TMessage | undefined;
}

const Message = ({ message, messageRenderers, onPressReplyJump, lookupMessageById }: MessageProps) => {
  const renderers = { ...defaultMessageRenderers, ...messageRenderers };
  const render = renderers[message.type] as ((content: any) => React.ReactElement) | undefined;

  const replyTarget = useMemo(() => {
    const ref = (message as any).referenceMessage as { referenceMessageId: string; type: MessageType; content: any } | undefined;
    if (ref) {
      // Attempt to resolve full message if available
      if (lookupMessageById) {
        const found = lookupMessageById(ref.referenceMessageId);
        if (found) return found as TMessage;
      }
      // Fallback to snapshot
      return {
        id: ref.referenceMessageId,
        from: '',
        isReceived: true,
        createdAt: 0,
        type: ref.type,
        content: ref.content,
      } as unknown as TMessage;
    }
    return null;
  }, [lookupMessageById, (message as any).referenceMessage]);

  return (
    <View>
      {replyTarget && (
        <Pressable style={styles.replyContainer} onPress={() => onPressReplyJump && onPressReplyJump((message as any).referenceMessage.referenceMessageId)}>
          <View style={styles.replyBar} />
          <View style={styles.replyTextWrap}>
            <Text style={styles.replyTitle} numberOfLines={1}>
              {replyTarget.isReceived ? 'Them' : 'You'}
            </Text>
            <Text style={styles.replySummary} numberOfLines={1}>
              {replyTarget.type === MessageType.TEXT
                ? (replyTarget.content as any)?.text || ''
                : replyTarget.type === MessageType.IMAGE
                ? 'Photo'
                : replyTarget.type === MessageType.VIDEO
                ? 'Video'
                : replyTarget.type === MessageType.AUDIO
                ? (replyTarget.content as any)?.voice ? 'Voice message' : 'Audio'
                : replyTarget.type === MessageType.DOCUMENT
                ? (replyTarget.content as any)?.fileName || 'Document'
                : replyTarget.type === MessageType.STICKER
                ? 'Sticker'
                : 'Message'}
            </Text>
          </View>
        </Pressable>
      )}
      {render ? render(message.content) : <Text style={styles.messageText}>[Unsupported message type]</Text>}
    </View>
  );
};

const defaultMessageRenderers: MessageRenderers = {
  [MessageType.TEXT]:    (content) => <MessageText content={content} />, 
  [MessageType.SYSTEM]:  (content) => <MessageSystem content={content} />, 
  [MessageType.IMAGE]:   (content) => <MessageImage content={content} />, 
  [MessageType.VIDEO]:   (content) => <MessageVideo content={content} />, 
  [MessageType.AUDIO]:   (content) => <MessageAudio content={content} />, 
  [MessageType.DOCUMENT]:(content) => <MessageDocument content={content} />, 
  [MessageType.STICKER]:  (content) => <MessageSticker content={content} />,
};

const styles = StyleSheet.create({
  messageText: { 
    fontSize: 16 
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyBar: {
    width: 3,
    height: 34,
    borderRadius: 2,
    backgroundColor: '#128C7E',
    marginRight: 6,
  },
  replyTextWrap: {
    flex: 1,
  },
  replyTitle: {
    fontSize: 12,
    color: '#128C7E',
    fontWeight: '600',
  },
  replySummary: {
    fontSize: 13,
    color: '#444',
  },
});

export default Message;
