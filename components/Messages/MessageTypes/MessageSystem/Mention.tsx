import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SystemMessageMention } from '../../../../types';

const Mention = ({ mention }: { mention: SystemMessageMention }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{mention.title}</Text>
    <Text style={styles.description}>{mention.description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    marginVertical: 4,
  },
  title: {
    color: '#1890ff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  description: {
    color: '#0050b3',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default Mention;
