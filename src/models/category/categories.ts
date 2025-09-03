import { Category } from '../category/Category';

export const categories: Category[] = [
  { key: 'design',     label: 'Design',     icon: { lib: 'MaterialCommunityIcons', name: 'drawing' } },
  { key: 'dev',        label: 'Developer',  icon: { lib: 'MaterialIcons',          name: 'code' } },
  { key: 'network',    label: 'Network',    icon: { lib: 'MaterialIcons',          name: 'wifi-tethering' } },
  { key: 'qa',         label: 'Quality',    icon: { lib: 'MaterialIcons',          name: 'verified' } },
  { key: 'marketing',  label: 'Marketing',  icon: { lib: 'Ionicons',               name: 'megaphone-outline' } },
  { key: 'secretary',  label: 'Secretary',  icon: { lib: 'Ionicons',               name: 'person-circle-outline' } },
  { key: 'analysis',   label: 'Analysis',   icon: { lib: 'MaterialIcons',          name: 'analytics' } },
  { key: 'more',       label: 'More',       icon: { lib: 'Ionicons',               name: 'ellipsis-horizontal' } },
];
