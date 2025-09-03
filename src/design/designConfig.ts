
export type Color = string;

export type DesignConfigType = {
  // Colors
  primaryColor: Color;
  backgroundColor: Color;
  buttonTextColor: Color;
  buttonBlueColor: Color;
  buttonRedColor: Color;
  buttonGreenColor: Color;
  buttonLightGrayColor: Color;
  buttonDarkGrayColor: Color;
  textFieldColor: Color;

  textColor: Color;
  subtextColor: Color;
  iconColor: Color;

  cardColor: Color;
  chipColor: Color;
  dividerColor: Color;

  // States
  successColor: Color;
  warningColor: Color;
  trueColor: Color;
  errorColor: Color;

  // App-specific
  secondaryAppBarColor: Color;
  splashColor: Color;
  highlightColor: Color;
  appBarOptionsColor: Color;
  primaryBackgroundColor: Color;
  appColor: Color;
  appBarColor: Color;
  lineColor: Color;
  orangeColor: Color;
  menuTextColor: Color;
  pinkColor: Color;
  dialogColor: Color;

  // Typography
  fontFamily: string;
  h1: number; h2: number; h3: number; h4: number; h5: number; h6: number;
  body: number; small: number; tiny: number;

  // Font Weights
  regular: "400" | "500" | "600" | "700" | "800" | "900";
  medium: "400" | "500" | "600" | "700" | "800" | "900";
  bold: "400" | "500" | "600" | "700" | "800" | "900";
  light: "400" | "500" | "600" | "700" | "800" | "900";
  semiBold: "400" | "500" | "600" | "700" | "800" | "900";

  // Radius
  cartBorderRadius: number;
  buttonBorderRadius: number;
  circleButtonBorderRadius: number;
};

let _current: DesignConfigType | null = null;

export const DesignConfig = {
  get current(): DesignConfigType {
    if (!_current) throw new Error("DesignConfig is not set. Call setDesignConfig() first.");
    return _current;
  },
  setDesignConfig(dc: DesignConfigType) {
    _current = dc;
  },
};
