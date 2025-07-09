import React from 'react';
import { View, ViewStyle } from 'react-native';
import tw from 'twrnc';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, style, className }) => {
  return (
    <View style={style}>{children}</View>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, style, className }) => {
  return (
    <View
      style={[
        tw`items-center justify-center`,
        { paddingTop: 32, paddingBottom: 8, paddingHorizontal: 28 },
        style
      ]}
    >
      {children}
    </View>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, style, className }) => {
  return (
    <View
      style={[
        tw`justify-center items-center`,
        style
      ]}
    >
      {children}
    </View>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, style, className }) => {
  return (
    <View
      style={[
        { paddingHorizontal: 28, paddingTop: 0, paddingBottom: 24 },
        style
      ]}
    >
      {children}
    </View>
  );
};

const CardFooter: React.FC<CardContentProps> = ({ children, style, className }) => {
  return (
    <View
      style={[
        { paddingHorizontal: 28, paddingTop: 0, paddingBottom: 24, borderTopWidth: 0 },
        style
      ]}
    >
      {children}
    </View>
  );
};

export { Card, CardHeader, CardTitle, CardContent, CardFooter }; 