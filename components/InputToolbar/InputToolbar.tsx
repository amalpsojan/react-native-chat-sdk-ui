import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioRecorder } from "expo-audio";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Message, MessageType, TextContent } from "../../types";
import ReplyPreview from "./ReplyPreview";

interface InputToolbarProps {
  onSendMessage: (message: Partial<Message>) => void;
  onScrollToBottom?: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

const InputToolbar: React.FC<InputToolbarProps> = ({
  onSendMessage,
  onScrollToBottom,
  replyTo,
  onCancelReply,
}) => {
  const [draft, setDraft] = useState("");
  const inputRef = React.useRef<TextInput>(null);
  const { height } = useReanimatedKeyboardAnimation();

  // Voice recording via expo-audio
  const recorder: any = (useAudioRecorder as any)({ extension: 'm4a' });
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: height.value + (height.value > 0 ? 0 : 30) }],
    };
  });

  const buildReferenceSnapshot = useCallback(() => {
    return replyTo
      ? {
          referenceMessageId: replyTo.id,
          type: replyTo.type,
          content: (replyTo as any).content as any,
        }
      : undefined;
  }, [replyTo]);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    onSendMessage({ 
      type: MessageType.TEXT, 
      content: { text: trimmed } as TextContent,
      referenceMessage: buildReferenceSnapshot(),
    });
    setDraft("");
    if (onCancelReply) onCancelReply();
    Keyboard.dismiss();
    if (onScrollToBottom) setTimeout(onScrollToBottom, 50);
  }, [draft, onSendMessage, onScrollToBottom, onCancelReply, buildReferenceSnapshot]);

  const startTimer = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const ensureMicPermission = useCallback(async () => {
    try {
      const anyRec: any = recorder;
      if (anyRec?.getPermissionsAsync) {
        const res = await anyRec.getPermissionsAsync();
        if (res?.granted) return true;
      }
      if (anyRec?.requestPermissionsAsync) {
        const res = await anyRec.requestPermissionsAsync();
        return !!res?.granted || res === true;
      }
      if (anyRec?.requestPermissions) {
        const res = await anyRec.requestPermissions();
        return !!res?.granted || res === true;
      }
    } catch {}
    // Fall through: attempt start will trigger OS prompt if available
    return true;
  }, [recorder]);

  const startRecording = useCallback(async () => {
    try {
      setRecordSecs(0);
      const ok = await ensureMicPermission();
      if (!ok) return;
      try { await recorder.start({}); } catch { await recorder.start(); }
      setIsRecording(true);
      startTimer();
    } catch {}
  }, [recorder, ensureMicPermission]);

  const cancelRecording = useCallback(async () => {
    try {
      stopTimer();
      try { await recorder.stop(); } catch {}
    } finally {
      setIsRecording(false);
    }
  }, [recorder]);

  const stopRecordingAndSend = useCallback(async () => {
    try {
      stopTimer();
      let uri: string | undefined;
      try {
        const result = await recorder.stop();
        uri = (result as any)?.uri || (result as any)?.file?.uri || (result as any);
      } catch {
        uri = undefined;
      }
      setIsRecording(false);
      if (uri) {
        onSendMessage({
          type: MessageType.AUDIO,
          content: { audio: uri, voice: true },
          referenceMessage: buildReferenceSnapshot(),
        });
        if (onCancelReply) onCancelReply();
        if (onScrollToBottom) setTimeout(onScrollToBottom, 50);
      }
    } catch {
      setIsRecording(false);
    } finally {
      stopTimer();
    }
  }, [recorder, onSendMessage, onScrollToBottom, onCancelReply, buildReferenceSnapshot]);

  const formatSecs = useMemo(() => {
    const m = Math.floor(recordSecs / 60).toString().padStart(2, "0");
    const s = (recordSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [recordSecs]);

  const hasDraft = draft.trim().length > 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {!!replyTo && (
        <ReplyPreview message={replyTo} onCancel={onCancelReply || (() => {})} />
      )}
      <View style={styles.inputBar}>
        {!isRecording ? (
          <>
            <TextInput
              ref={inputRef}
              style={[styles.input]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Message..."
              placeholderTextColor="#888"
              multiline={true}
              returnKeyType="default"
            />
            {hasDraft ? (
              <Pressable style={[styles.roundAction, styles.roundActionSend]} onPress={handleSend}>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </Pressable>
            ) : (
              <Pressable style={[styles.roundAction, styles.roundActionMic]} onPress={startRecording}>
                <MaterialCommunityIcons name="microphone" size={22} color="#fff" />
              </Pressable>
            )}
          </>
        ) : (
          <View style={styles.recordingWrap}>
            <Pressable style={[styles.smallRound, styles.smallRoundCancel]} onPress={cancelRecording}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#333" />
            </Pressable>
            <View style={styles.recordCenter}>
              <MaterialCommunityIcons name="record-circle" size={18} color="#FF3B30" style={{ marginRight: 6 }} />
              <Text style={styles.recordTimer}>{formatSecs}</Text>
            </View>
            <Pressable style={[styles.smallRound, styles.smallRoundSend]} onPress={stopRecordingAndSend}>
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const WAPP_GREEN = '#25D366';
const WAPP_ACCENT = '#128C7E';

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  inputBar: {
    flexDirection: "row",
    padding: 10,
    paddingBottom: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: 10,
    paddingTop: 10,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 18,
    minHeight: 40,
    maxHeight: 100
  },
  roundAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActionMic: {
    backgroundColor: WAPP_GREEN,
  },
  roundActionSend: {
    backgroundColor: WAPP_GREEN,
  },
  recordingWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  smallRound: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallRoundCancel: {
    backgroundColor: '#eaeaea',
  },
  smallRoundSend: {
    backgroundColor: WAPP_GREEN,
    marginLeft: 'auto',
  },
  recordCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  recordTimer: {
    fontSize: 14,
    color: "#222",
    marginLeft: 2,
  },
});

export default InputToolbar;
