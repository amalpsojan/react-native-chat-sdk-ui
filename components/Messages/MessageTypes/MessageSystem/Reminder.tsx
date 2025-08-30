import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SystemMessageReminder } from '../../../../types';

const Reminder = ({ reminder }: { reminder: SystemMessageReminder }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{reminder.title}</Text>
    <Text style={styles.description}>{reminder.description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#fffbe6',
    borderRadius: 8,
    marginVertical: 4,
  },
  title: {
    color: '#b8860b',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  description: {
    color: '#7a6600',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default Reminder;
