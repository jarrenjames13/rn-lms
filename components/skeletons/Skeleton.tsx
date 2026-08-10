import React from "react";
import { useAppTheme } from "@/theme";
import { DimensionValue, StyleProp, ViewProps, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  baseColor?: string;
  highlightColor?: string;
  /** 'pulse' for opacity animation, 'shimmer' for sliding effect */
  variant?: "pulse" | "shimmer";
  duration?: number;
}

export default function Skeleton({
  width = "100%",
  height = 16,
  style,
  borderRadius = 8,
  baseColor,
  highlightColor,
  variant = "shimmer",
  duration = 1500,
}: SkeletonProps) {
  const { theme } = useAppTheme();
  const opacity = useSharedValue(0.3);
  const translateX = useSharedValue(-300);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  React.useEffect(() => {
    if (variant === "pulse") {
      opacity.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      translateX.value = withRepeat(
        withTiming(300, { duration, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, [opacity, translateX, variant, duration]);

  const baseStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: baseColor ?? theme.border,
  };

  if (variant === "pulse") {
    return (
      <Animated.View
        accessible={true}
        accessibilityLabel="Loading content"
        accessibilityRole="none"
        style={[baseStyle, pulseStyle, style]}
      />
    );
  }

  // Shimmer variant
  const containerStyle: ViewStyle = {
    ...baseStyle,
    overflow: "hidden",
  };

  const shimmerOverlayStyle: ViewStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: highlightColor ?? theme.surfaceMuted,
    opacity: 0.5,
  };

  return (
    <Animated.View
      accessible={true}
      accessibilityLabel="Loading content"
      accessibilityRole="none"
      style={[containerStyle, style]}
    >
      <Animated.View style={[shimmerOverlayStyle, shimmerStyle]} />
    </Animated.View>
  );
}
