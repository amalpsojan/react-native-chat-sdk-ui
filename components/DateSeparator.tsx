import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DateSeparatorProps {
  timestamp: number;
}

/**
 * DateSeparator - Shows date headers like "Today", "Yesterday", etc.
 * 
 * Used to group messages by date
 */
const DateSeparator = ({ timestamp }: DateSeparatorProps) => {
  const getDateText = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format as "Today", "Yesterday", or day of week, or full date
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    } else if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    } else if (today.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Within last 7 days, show day name
      return messageDate.toLocaleDateString(undefined, { weekday: 'long' });
    } else {
      // Older messages show full date
      return messageDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.textContainer}>
        <Text style={styles.text}>{getDateText(timestamp)}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
  },
  textContainer: {
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
});

export default DateSeparator; 