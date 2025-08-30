import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type MessageActionKey = 'copy' | 'reply' | 'edit' | 'delete' | 'retry' | 'download' | 'share';

export interface ActionItem {
  key: MessageActionKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}

interface MessageActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionItem[];
}

const MessageActionsMenu: React.FC<MessageActionsMenuProps> = ({ visible, onClose, actions }) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(12, insets.bottom);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
          {actions.map((a) => (
            <Pressable key={a.key} style={styles.item} onPress={() => { onClose(); a.onPress(); }}>
              <MaterialCommunityIcons name={a.icon} size={20} color="#333" style={{ marginRight: 10 }} />
              <Text style={styles.itemText}>{a.label}</Text>
            </Pressable>
          ))}
          <View style={styles.separator} />
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#222',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    color: '#128C7E',
    fontWeight: '600',
  },
});

export default MessageActionsMenu; 