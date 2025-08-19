import { ViewStyle, TextStyle } from 'react-native';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function combineStyles(...styles: (ViewStyle | TextStyle | undefined | null | false)[]): (ViewStyle | TextStyle)[] {
  return styles.filter(Boolean) as (ViewStyle | TextStyle)[];
}

export function createStyleSheet<T extends Record<string, ViewStyle | TextStyle>>(styles: T): T {
  return styles;
} 