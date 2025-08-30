import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Message, MessageType } from '../../types';

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

const getSummary = (m: Message): string => {
  switch (m.type) {
    case MessageType.TEXT:
      return (m.content as any)?.text ?? '';
    case MessageType.IMAGE:
      return 'Photo';
    case MessageType.VIDEO:
      return 'Video';
    case MessageType.AUDIO:
      return (m.content as any)?.voice ? 'Voice message' : 'Audio';
    case MessageType.DOCUMENT:
      return (m.content as any)?.fileName || 'Document';
    case MessageType.STICKER:
      return 'Sticker';
    case MessageType.SYSTEM:
      return 'System';
    default:
      return '';
  }
};

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onCancel }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bar} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          Replying to {message.isReceived ? 'them' : 'you'}
        </Text>
        <Text style={styles.summary} numberOfLines={1}>
          {getSummary(message)}
        </Text>
      </View>
      <Pressable onPress={onCancel} style={styles.closeBtn} hitSlop={8}>
        <MaterialCommunityIcons name="close" size={18} color="#666" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  bar: {
    width: 3,
    height: 34,
    borderRadius: 2,
    backgroundColor: '#128C7E',
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: '#128C7E',
    fontWeight: '600',
    marginBottom: 2,
  },
  summary: {
    fontSize: 13,
    color: '#444',
  },
  closeBtn: {
    padding: 6,
  },
});

export default ReplyPreview; 