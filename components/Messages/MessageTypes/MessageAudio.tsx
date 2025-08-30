import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioContent } from '../../../types/types';
import { ensureExclusivePlayback, registerAudioInstance, unregisterAudioInstance } from './audioCoordinator';

// Formats seconds to mm:ss
function formatTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Track dimensions
const TRACK_HEIGHT = 3;
const KNOB_SIZE = 12;

type MaybeNumber = number | undefined;

// Using any here as expo-audio hook shape can vary
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlayer = any;

const MessageAudio = ({ content }: { content: AudioContent }) => {
  const player: AnyPlayer = useAudioPlayer(content.audio);
  const instanceId = useMemo(() => Symbol('audio'), []);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<MaybeNumber>(undefined);
  const [position, setPosition] = useState<MaybeNumber>(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const containerRef = useRef<View | null>(null);

  // Register for exclusive playback coordination
  useEffect(() => {
    const pauseSelf = async () => {
      try {
        if (player?.pause) await player.pause();
      } catch {}
      setIsPlaying(false);
    };
    registerAudioInstance(instanceId, pauseSelf);
    return () => unregisterAudioInstance(instanceId);
  }, [instanceId, player]);

  // Sync from player if it exposes fields
  useEffect(() => {
    setIsPlaying(!!player?.playing || !!player?.isPlaying);
  }, [player?.playing, player?.isPlaying]);

  // Poll playback position/duration periodically while mounted (rAF)
  useEffect(() => {
    let rafId: number;

    const readStatus = async () => {
      try {
        const rawPos =
          (await player?.getPosition?.()) ??
          player?.position ??
          player?.positionMillis ??
          player?.currentTime;
        const rawDur =
          (await player?.getDuration?.()) ??
          player?.duration ??
          player?.durationMillis ??
          player?.getStatus?.()?.durationMillis;

        const posSec = typeof rawPos === 'number' ? rawPos / (rawPos > 10000 ? 1000 : 1) : undefined;
        const durSec = typeof rawDur === 'number' ? rawDur / (rawDur > 10000 ? 1000 : 1) : undefined;

        if (posSec !== undefined) setPosition(posSec);
        if (durSec !== undefined) setDuration(durSec);

        // If playback naturally reached the end, ensure UI shows Play
        if (durSec && posSec !== undefined && posSec >= Math.max(0, durSec - 0.05)) {
          setIsPlaying(false);
        }
      } catch {}
      rafId = requestAnimationFrame(readStatus);
    };

    rafId = requestAnimationFrame(readStatus);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [player]);

  const togglePlay = useCallback(async () => {
    try {
      if (isPlaying) {
        await (player?.pause?.() ?? player?.stop?.());
        setIsPlaying(false);
        return;
      }

      // If at end, seek back to start before playing again
      const atEnd = !!duration && position !== undefined && position >= Math.max(0, (duration as number) - 0.05);
      if (atEnd) {
        await (
          player?.seek?.(0) ??
          player?.setPositionAsync?.(0) ??
          player?.seekTo?.(0)
        );
        setPosition(0);
      }

      // Ensure other players are paused
      await ensureExclusivePlayback(instanceId);

      await (player?.play?.() ?? player?.start?.());
      setIsPlaying(true);
    } catch {}
  }, [isPlaying, player, duration, position, instanceId]);

  const handleSeekPercent = useCallback(
    async (p: number) => {
      if (!duration || !isFinite(duration)) return;
      const target = Math.max(0, Math.min(duration * p, duration));
      try {
        await (
          player?.seek?.(target) ??
          player?.setPositionAsync?.(target * 1000) ??
          player?.seekTo?.(target)
        );
        setPosition(target);
      } catch {}
    },
    [duration, player]
  );

  // PanResponder for scrubbing on track
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!trackWidth) return;
        const x = evt.nativeEvent.locationX;
        handleSeekPercent(Math.max(0, Math.min(1, x / trackWidth)));
      },
      onPanResponderMove: (evt) => {
        if (!trackWidth) return;
        const x = evt.nativeEvent.locationX;
        handleSeekPercent(Math.max(0, Math.min(1, x / trackWidth)));
      },
    }),
  [trackWidth, handleSeekPercent]
  );

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const progress = useMemo(() => {
    if (!duration || !position) return 0;
    return Math.max(0, Math.min(1, position / duration));
  }, [position, duration]);

  const knobLeft = useMemo(() => {
    const px = progress * trackWidth;
    return Math.max(0, Math.min(trackWidth, px)) - KNOB_SIZE / 2;
  }, [progress, trackWidth]);

  const currentLabel = formatTime(position || 0);
  const durationLabel = formatTime(duration || 0);

  return (
    <View style={styles.container} ref={(r) => { containerRef.current = r; }}>
      <TouchableOpacity style={styles.playButton} onPress={togglePlay} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color="#fff"
        />
      </TouchableOpacity>

      <View style={styles.centerColumn}>
        <View style={styles.trackWrapper} onLayout={onTrackLayout} {...panResponder.panHandlers}>
          <View style={styles.trackBase} />
          <View style={[styles.trackProgress, { width: trackWidth * progress }]} />
          <View style={[styles.knob, { left: knobLeft }]} />
        </View>
        <View style={styles.timesRow}>
          <Text style={styles.timeText}>{currentLabel}</Text>
          <Text style={styles.timeText}>{durationLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerColumn: {
    flex: 1,
    marginHorizontal: 10,
  },
  trackWrapper: {
    height: 24,
    justifyContent: 'center',
  },
  trackBase: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#C7D0D0',
    width: '100%',
  },
  trackProgress: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#128C7E',
    left: 0,
    top: (24 - TRACK_HEIGHT) / 2,
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#128C7E',
    top: (24 - KNOB_SIZE) / 2,
  },
  timesRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#667085',
  },
});

export default MessageAudio; 