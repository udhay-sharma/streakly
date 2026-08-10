import * as React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button({ label, variant = 'default', className, ...props }: ButtonProps) {
  const baseClasses = 'h-12 items-center justify-center rounded-lg px-6 flex-row';
  
  const variantClasses = {
    default: 'bg-primary active:opacity-80',
    outline: 'border border-primary bg-transparent active:bg-primary/10',
    ghost: 'bg-transparent active:bg-surface',
  };

  const textBaseClasses = 'font-semibold text-base';
  
  const textVariantClasses = {
    default: 'text-background', // Assuming primary color is dark/light enough for background text, actually text should be white or inverse. Let's just use white or inverse. Wait, STREAKLY_ARCHITECTURE says light mode primary is #A9764A (clay), text on it should probably be #FFFDF8 (surface).
    outline: 'text-primary',
    ghost: 'text-primary',
  };

  // Adjust default variant text to use surface which acts as an inverse on primary buttons
  const resolvedTextClasses = variant === 'default' ? 'text-surface' : textVariantClasses[variant];

  return (
    <Pressable
      className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
      {...props}
    >
      <Text className={`${textBaseClasses} ${resolvedTextClasses}`}>
        {label}
      </Text>
    </Pressable>
  );
}
