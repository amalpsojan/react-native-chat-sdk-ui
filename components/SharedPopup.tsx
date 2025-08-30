import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { ReactNode } from "react";
import {
    Dimensions,
    Modal,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SharedPopupProps {
  visible: boolean;
  onClose: () => void;
  renderInitialLayout: () => ReactNode;
  renderPopupLayout: (layout: { width: number; height: number }) => ReactNode;
  initialLayout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  showCloseButton?: boolean;
  animateToCenter?: boolean;
}

const SharedPopup: React.FC<SharedPopupProps> = ({
  visible,
  onClose,
  renderInitialLayout,
  renderPopupLayout,
  initialLayout = { x: 0, y: 0, width: screenWidth, height: screenHeight },
  showCloseButton = true,
  animateToCenter = true,
}) => {
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible && animateToCenter) {
      // Calculate the center offset for smooth transition
      const centerX = screenWidth / 2 - initialLayout.x - initialLayout.width / 2;
      const centerY = screenHeight / 2 - initialLayout.y - initialLayout.height / 2;

      // Start opening animation
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withSpring(centerX, { damping: 20, stiffness: 100 });
      translateY.value = withSpring(centerY, { damping: 20, stiffness: 100 });
      
      // Calculate optimal scale to fit screen
      const optimalScale = Math.min(
        screenWidth / initialLayout.width,
        screenHeight / initialLayout.height
      ) * 0.9;
      
      scale.value = withSpring(optimalScale, { damping: 20, stiffness: 100 });
    } else if (visible) {
      // Just fade in without centering animation
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      // Reset values when closing
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 0;
    }
  }, [visible, initialLayout, animateToCenter]);

  const closePopup = () => {
    if (animateToCenter) {
      // Animate back to original position
      scale.value = withSpring(1, { damping: 20, stiffness: 100 });
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onClose)();
      });
    } else {
      // Just fade out
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(onClose)();
      });
    }
  };

  // Animated styles
  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) {
    return <>{renderInitialLayout()}</>;
  }

  return (
    <>
      {/* Always render the initial layout */}
      {renderInitialLayout()}
      
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={closePopup}
      >
        <GestureHandlerRootView style={styles.container}>
          <StatusBar hidden />

          {/* Dark Background */}
          <Animated.View style={[styles.modalBackground, backgroundStyle]}/>

          {/* Close Button */}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
              <View style={styles.closeButtonBackground}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Content Container */}
          <View
            style={[
              styles.contentContainer,
              {
                left: initialLayout.x,
                top: initialLayout.y,
                width: initialLayout.width,
                height: initialLayout.height,
              },
            ]}
          >
            {animateToCenter ? (
              <Animated.View style={animatedContentStyle}>
                {renderPopupLayout({
                  width: initialLayout.width,
                  height: initialLayout.height,
                })}
              </Animated.View>
            ) : (
              <View style={StyleSheet.absoluteFillObject}>
                {renderPopupLayout({
                  width: screenWidth,
                  height: screenHeight,
                })}
              </View>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  closeButtonBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
  contentContainer: {
    position: "absolute",
  },
});

export default SharedPopup;