import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import Toast, { ToastProps } from './toast';
import tw from 'twrnc';

interface ToasterProps {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => {
  const [visibleToasts, setVisibleToasts] = useState<ToastProps[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    setVisibleToasts(toasts);
  }, [toasts]);

  useEffect(() => {
    if (visibleToasts.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visibleToasts, fadeAnim, slideAnim]);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        tw`absolute top-0 left-0 right-0 z-50`,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={tw`p-4 space-y-2`}>
        {visibleToasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => onDismiss(toast.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export default Toaster; 