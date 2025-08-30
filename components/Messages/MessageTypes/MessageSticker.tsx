import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StickerContent } from '../../../types/types';

const MessageSticker = ({ content }: { content: StickerContent }) => (
  <View style={styles.container}>
    <Image source={{ uri: content.sticker }} style={styles.image} />
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  image: { width: 200, height: 200, borderRadius: 8, marginBottom: 4 },
});

export default MessageSticker; 