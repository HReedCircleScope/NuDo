import { Platform } from 'react-native';

export const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000'
  : 'http://10.134.180.90:3000';
