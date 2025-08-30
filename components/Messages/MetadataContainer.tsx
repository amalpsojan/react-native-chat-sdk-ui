import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message as TMessage } from '../../types';
import MessageStatus from './MessageStatus';
import Time from './Time';

interface MetadataContainerProps {
  isEdited: boolean;
  createdAt: number;
  isReceived: boolean;
  status?: TMessage['status'];
}

const MetadataContainer: React.FC<MetadataContainerProps> = ({
  isEdited,
  createdAt,
  isReceived,
  status,
}) => (
  <View style={styles.metadataContainer}>
    {isEdited && <Text style={styles.editedText}>(edited)</Text>}
    <Time timestamp={createdAt} />
    {!isReceived && <MessageStatus status={status} />}
  </View>
);

const styles = StyleSheet.create({
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  editedText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginRight: 4,
  },
}); 

export default MetadataContainer; 