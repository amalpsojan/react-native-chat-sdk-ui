import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { Message as TMessage } from '../../types';

interface MessageStatusProps {
  status?: TMessage['status'];
  style?: StyleProp<TextStyle>;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status, style }) => {
  if (status === 'pending') return <MaterialCommunityIcons name="clock-outline" size={16} color="#999" style={[styles.statusText, style]} />;
  if (status === 'failed') return <MaterialCommunityIcons name="alert-circle-outline" size={16} color="red" style={[styles.statusText, style]} />;
  if (status === 'sent') return <MaterialCommunityIcons name="check" size={16} color="#999" style={[styles.statusText, style]} />;
  if (status === 'delivered') return (
    <View style={styles.iconRow}>
      <MaterialCommunityIcons name="check" size={16} color="#999" style={[styles.statusText, style, { marginRight: -4 }]} />
      <MaterialCommunityIcons name="check" size={16} color="#999" style={[styles.statusText, style]} />
    </View>
  );
  if (status === 'read') return (
    <View style={styles.iconRow}>
      <MaterialCommunityIcons name="check" size={16} color="#2196F3" style={[styles.statusText, style, { marginRight: -4 }]} />
      <MaterialCommunityIcons name="check" size={16} color="#2196F3" style={[styles.statusText, style]} />
    </View>
  );
  return null;
};

const styles = StyleSheet.create({
  statusText: {},
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MessageStatus; 