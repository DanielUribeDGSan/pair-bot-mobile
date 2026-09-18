import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ContextMeterMobileProps {
  textLength?: number;
  messageCount?: number;
}

export function ContextMeterMobile({ textLength = 0, messageCount = 0 }: ContextMeterMobileProps) {
  // Simulamos el uso de contexto
  const estimatedTokens = (textLength + (messageCount * 300)) * 0.25;
  const maxTokens = 128000;
  
  let progress = (estimatedTokens / maxTokens) * 100;
  
  // Un mínimo visual cuando hay algo de texto
  if (estimatedTokens > 0 && progress < 5) progress = 5; 
  if (progress > 100) progress = 100;

  const radius = 8;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
      <Svg width="20" height="20" viewBox="0 0 20 20">
        <Circle
          cx="10"
          cy="10"
          r={radius}
          stroke="#333"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx="10"
          cy="10"
          r={radius}
          stroke="#A3A3A3"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin="10, 10"
        />
      </Svg>
    </View>
  );
}
