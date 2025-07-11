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

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, style, className }) => {
  return (
    <View style={[tw`rounded-2xl`, style]}>
      {children}
    </View>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, style, className }) => {
  return (
    <View style={[tw`px-6 pt-6 pb-4`, style]}>
      {children}
    </View>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, style, className }) => {
  return (
    <View style={[tw`items-center`, style]}>
      {children}
    </View>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, style, className }) => {
  return (
    <View style={[tw`px-6 pb-6`, style]}>
      {children}
    </View>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, style, className }) => {
  return (
    <View style={[tw`px-6 pt-4 pb-6 border-t border-gray-800/50`, style]}>
      {children}
    </View>
  );
};

export { Card, CardHeader, CardTitle, CardContent, CardFooter };