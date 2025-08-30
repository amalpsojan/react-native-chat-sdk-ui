import React, { Fragment, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ImageContent } from "../../../types/types";
import SharedPopup from "../../SharedPopup";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface InitialLayoutProps {
  content: ImageContent;
  onPress: (event: any) => void;
}

interface PopupLayoutProps {
  content: ImageContent;
  layout: { width: number; height: number };
  onClose: () => void;
}

// Component for the initial image layout (thumbnail in chat)
const InitialLayout: React.FC<InitialLayoutProps> = ({ content, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: content.image }}
        style={styles.previewImage}
        resizeMode="cover"
      />
      {content.caption && (
        <Text style={styles.caption} numberOfLines={2}>
          {content.caption}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Component for the popup layout with gestures
const PopupLayout: React.FC<PopupLayoutProps> = ({
  content,
  layout,
  onClose,
}) => {
  // Animation values for gestures
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const maxZoom = 4;
  const minZoom = 0.3;

  // Double tap gesture for zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const currentScale = scale.value;
      if (currentScale > 1.5) {
        // Zoom out to fit
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in
        const newScale = 2.5;
        scale.value = withSpring(newScale);
        savedScale.value = newScale;
      }
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      // Save current values
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(minZoom, Math.min(newScale, maxZoom));
    })
    .onEnd(() => {
      if (scale.value < 0.8) {
        // Close if zoomed out too much
        runOnJS(onClose)();
      } else if (scale.value < 1) {
        // Snap back to normal size
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Save the final scale
        savedScale.value = scale.value;
      }
    });

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Save current translate values
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd((event) => {
      // Calculate distance dragged
      const distance = Math.sqrt(
        event.translationX ** 2 + event.translationY ** 2
      );

      if (distance > 150 && scale.value <= 1.2) {
        // Close if dragged far and not zoomed in much
        runOnJS(onClose)();
      } else {
        // Constrain within bounds based on zoom level
        const imageWidth = layout.width * scale.value;
        const imageHeight = layout.height * scale.value;

        // Calculate max translation to keep image visible
        const maxTranslateX = Math.max(0, (imageWidth - screenWidth) / 2);
        const maxTranslateY = Math.max(0, (imageHeight - screenHeight) / 2);

        // Constrain and animate to bounds
        const constrainedX = Math.max(
          -maxTranslateX,
          Math.min(maxTranslateX, translateX.value)
        );
        const constrainedY = Math.max(
          -maxTranslateY,
          Math.min(maxTranslateY, translateY.value)
        );

        translateX.value = withSpring(constrainedX);
        translateY.value = withSpring(constrainedY);

        // Save final positions
        savedTranslateX.value = constrainedX;
        savedTranslateY.value = constrainedY;
      }
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture
  );

  // Animated styles
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Fragment>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedImageStyle}>
          <Image
            source={{ uri: content.image }}
            style={[
              styles.fullscreenImage,
              { width: layout.width, height: layout.height },
            ]}
            resizeMode="cover"
          />
        </Animated.View>
      </GestureDetector>
    </Fragment>
  );
};

// Main MessageImage component
const MessageImage = ({ content }: { content: ImageContent }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLayout, setImageLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const openFullscreen = (event: any) => {
    // Get the image position for smooth transition
    event.target.measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        setImageLayout({ x: pageX, y: pageY, width, height });
        setIsFullscreen(true);
      }
    );
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const renderInitialLayout = () => (
    <InitialLayout content={content} onPress={openFullscreen} />
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
      initialLayout={imageLayout}
      showCloseButton={true}
      animateToCenter={true}
    />
  );
};

const styles = StyleSheet.create({
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  fullscreenImage: {
    borderRadius: 8,
  },
  caption: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 18,
  },
  fullscreenCaption: {
    position: "absolute",
    bottom: 10,
    right: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: 14,
    lineHeight: 18,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessageImage;
