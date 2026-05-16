import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';

interface Props extends PressableProps {
  scale?: number;
  springConfig?: { friction?: number; tension?: number };
  children: React.ReactNode;
}

export const PressableScale = React.memo(function PressableScale({
  children,
  scale: targetScale = 0.96,
  springConfig = { friction: 8, tension: 100 },
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={(e) => {
        Animated.spring(scale, { toValue: targetScale, useNativeDriver: true, ...springConfig }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...springConfig }).start();
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});
