import React from 'react';
import { StyleProp, Text, TextStyle,StyleSheet } from 'react-native';

interface TimeProps {
  timestamp: number;
  style?: StyleProp<TextStyle>;
}

const Time: React.FC<TimeProps> = ({ timestamp, style }) => {
  const date = new Date(timestamp);
  const formatted = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  return <Text style={[styles.timeText, style]}>{formatted}</Text>;
};

const styles = StyleSheet.create({
  timeText: {
    fontSize: 11,
    color: '#999',
    marginRight: 4,
  },
});

export default Time; 