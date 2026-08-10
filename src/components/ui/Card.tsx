import * as React from 'react';
import { View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {}

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface border border-border rounded-lg p-4 shadow-sm ${className || ''}`}
      {...props}
    />
  );
}
