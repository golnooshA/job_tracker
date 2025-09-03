export type CategoryKey =
  | 'design'
  | 'dev'
  | 'network'
  | 'qa'
  | 'marketing'
  | 'secretary'
  | 'analysis'
  | 'more';

export type IconLib = 'MaterialCommunityIcons' | 'MaterialIcons' | 'Ionicons';

export interface Category {
  key: CategoryKey;
  label: string;
  icon: { lib: IconLib; name: string };
}
