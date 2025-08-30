import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SystemMessageInfo } from '../../../../types';

const Info = ({ info }: { info: SystemMessageInfo }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{info.text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    marginVertical: 4,
  },
  text: {
    color: '#3a3a3a',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default Info;
