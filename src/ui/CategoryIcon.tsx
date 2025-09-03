import React from 'react';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Category } from '../models/category/Category';

export function CategoryIcon({
  icon,
  size,
  color,
}: {
  icon: Category['icon'];
  size: number;
  color: string;
}) {
  if (icon.lib === 'Ionicons') return <Ionicons name={icon.name as any} size={size} color={color} />;
  if (icon.lib === 'MaterialIcons') return <MaterialIcons name={icon.name as any} size={size} color={color} />;
  return <MaterialCommunityIcons name={icon.name as any} size={size} color={color} />;
}
