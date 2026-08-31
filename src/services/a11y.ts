import { AccessibilityInfo } from 'react-native';

export async function prefersReduceMotion(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}
