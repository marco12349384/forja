import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface Props {
  delay?: number;
  duration?: number;
  offset?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView = React.memo(function FadeInView({
  delay = 0,
  duration = 400,
  offset = 12,
  children,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.spring(translate, { toValue: 0, friction: 8, tension: 60, delay, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity, translate, duration, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: translate }] }, style]}>
      {children}
    </Animated.View>
  );
});
