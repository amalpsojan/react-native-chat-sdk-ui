import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { VideoContent } from "../../../types/types";
import SharedPopup from "../../SharedPopup";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface InitialLayoutProps {
  content: VideoContent;
  onPress: () => void;
  containerRef: React.RefObject<View | null>;
  onLayout: (e: LayoutChangeEvent) => void;
}

interface PopupLayoutProps {
  content: VideoContent;
  layout: { width: number; height: number };
  onClose: () => void;
}

// Component for the initial video layout (thumbnail in chat)
const InitialLayout: React.FC<InitialLayoutProps> = ({
  content,
  onPress,
  containerRef,
  onLayout,
}) => {
  const [image, setImage] = useState<string | null>(null);

  const generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(content.video, {
        time: 15000,
      });
      setImage(uri);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    generateThumbnail();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View
        ref={containerRef}
        style={styles.previewWrapper}
        collapsable={false}
        onLayout={onLayout}
      >
        {image ? (
          <ImageBackground
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.playIconContainer}>
          <MaterialCommunityIcons name="play" size={40} color="white" />
        </View>
      </View>
      {content.caption && (
        <Text style={styles.caption} numberOfLines={2}>
          {content.caption}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Component for the popup layout
const PopupLayout: React.FC<PopupLayoutProps> = ({
  content,
  layout,
  onClose,
}) => {
  const player = useVideoPlayer(content.video);
  const playerRef = useRef<VideoView>(null);

  useEffect(() => {
    const enterFullscreen = () => {
      if (playerRef?.current && playerRef?.current?.props?.player) {
        playerRef?.current?.enterFullscreen();
      }
    };

    setTimeout(() => {
      enterFullscreen();
    }, 1000);
  }, []);

  return (
    <Fragment>
      <VideoView
        ref={playerRef}
        player={player}
        style={[
          styles.fullscreenVideo,
          { width: layout.width, height: layout.height },
        ]}
        contentFit="contain"
        allowsFullscreen={false}
        onFullscreenEnter={() => {
          playerRef?.current?.props?.player?.play();
        }}
        onFullscreenExit={onClose}
      />
    </Fragment>
  );
};

// Main MessageVideo component
const MessageVideo = ({ content }: { content: VideoContent }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoLayout, setVideoLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const previewRef = useRef<View | null>(null);
  const previewSizeRef = useRef<{ width: number; height: number }>({
    width: 200,
    height: 200,
  });

  const handlePreviewLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    previewSizeRef.current = {
      width: width || 200,
      height: height || 200,
    };
  };

  const openFullscreen = () => {
    // Measure the preview to animate from its on-screen position
    if (
      previewRef.current &&
      typeof previewRef.current.measureInWindow === "function"
    ) {
      previewRef.current.measureInWindow(
        (pageX: number, pageY: number, _width: number, _height: number) => {
          const { width, height } = previewSizeRef.current;
          setVideoLayout({ x: pageX, y: pageY, width, height });
          setIsFullscreen(true);
        }
      );
    } else if (
      previewRef.current &&
      typeof previewRef.current.measure === "function"
    ) {
      previewRef.current.measure(
        (
          _x: number,
          _y: number,
          _width: number,
          _height: number,
          pageX: number,
          pageY: number
        ) => {
          const { width, height } = previewSizeRef.current;
          setVideoLayout({ x: pageX, y: pageY, width, height });
          setIsFullscreen(true);
        }
      );
    } else {
      // Fallback: open centered if measurement is unavailable
      setIsFullscreen(true);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const renderInitialLayout = () => (
    <InitialLayout
      content={content}
      onPress={openFullscreen}
      containerRef={previewRef}
      onLayout={handlePreviewLayout}
    />
  );

  const renderPopupLayout = (layout: { width: number; height: number }) => (
    <PopupLayout content={content} layout={layout} onClose={closeFullscreen} />
  );

  return (
    <SharedPopup
      visible={isFullscreen}
      onClose={closeFullscreen}
      renderInitialLayout={renderInitialLayout}
      renderPopupLayout={renderPopupLayout}
      initialLayout={videoLayout}
      showCloseButton={true}
      animateToCenter={true}
    />
  );
};

const styles = StyleSheet.create({
  previewWrapper: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenVideo: {
    borderRadius: 8,
  },
  caption: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 18,
  },
  playIconContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: 100,
    padding: 10,
  },
});

export default MessageVideo;
