import { Dimensions, PixelRatio, ScaledSize } from "react-native";

const guidelineBaseWidth = 375;  // iPhone 11/12/13
const guidelineBaseHeight = 812;

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// نسبتی از عرض/ارتفاع (vw/vh)
export const vw = (percent: number) => (SCREEN_WIDTH * percent) / 100;
export const vh = (percent: number) => (SCREEN_HEIGHT * percent) / 100;

// تشخیص دستگاه
export const isTablet = () => Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 768;
export const isSmallPhone = () => Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) <= 360;

// واکنش به تغییر اندازه (چرخش)
export const onResize = (cb: (d: ScaledSize) => void) => {
  const { addEventListener, removeEventListener } = Dimensions as any;
  const sub = addEventListener("change", ({ window }: { window: ScaledSize }) => cb(window));
  return () => removeEventListener?.("change", sub) ?? sub?.remove();
};

// اندازهٔ فونت متناسب با مقیاس
export const rf = (size: number) => {
  const newSize = moderateScale(size, 0.4);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// پکیج کمکی یک‌جا
export const rs = {
  s: scale,
  vs: verticalScale,
  ms: moderateScale,
  rf,
  vw,
  vh,
  isTablet: isTablet(),
  isSmallPhone: isSmallPhone(),
};
