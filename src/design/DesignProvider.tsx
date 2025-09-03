import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { DesignConfig, DesignConfigType } from "./designConfig";
import { DesignLightConfig } from "./designLightConfig";
import { DesignDarkConfig } from "./designDarkConfig";
import { rs } from "../utils/responsive";

type Mode = "light" | "dark";
type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  theme: DesignConfigType & {
    spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  };
  rs: typeof rs;
};

const DesignCtx = createContext<Ctx | null>(null);

export const DesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sys = Appearance.getColorScheme();
  const [mode, setMode] = useState<Mode>(sys === "dark" ? "dark" : "light");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("design_mode");
      if (saved === "dark" || saved === "light") setMode(saved);
    })();
  }, []);

  const base = useMemo(() => (mode === "dark" ? DesignDarkConfig : DesignLightConfig), [mode]);

  const themeScaled = useMemo<Ctx["theme"]>(() => {
    const scaleFont = (v: number) => rs.rf(v);
    const scaleNum = (v: number) => Math.round(rs.ms(v));

    return {
      ...base,
      h1: scaleFont(base.h1),
      h2: scaleFont(base.h2),
      h3: scaleFont(base.h3),
      h4: scaleFont(base.h4),
      h5: scaleFont(base.h5),
      h6: scaleFont(base.h6),
      body: scaleFont(base.body),
      small: scaleFont(base.small),
      tiny: scaleFont(base.tiny),

      buttonBorderRadius: scaleNum(base.buttonBorderRadius),
      cartBorderRadius: scaleNum(base.cartBorderRadius),
      circleButtonBorderRadius: base.circleButtonBorderRadius, 

      spacing: {
        xs: scaleNum(6),
        sm: scaleNum(8),
        md: scaleNum(12),
        lg: scaleNum(16),
        xl: scaleNum(20),
      },
    };
  }, [base]);

  useEffect(() => {
    DesignConfig.setDesignConfig(themeScaled);
    AsyncStorage.setItem("design_mode", mode).catch(() => {});
  }, [themeScaled, mode]);

  const value: Ctx = useMemo(() => ({ mode, setMode, theme: themeScaled, rs }), [mode, themeScaled]);

  return <DesignCtx.Provider value={value}>{children}</DesignCtx.Provider>;
};

export const useDesign = () => {
  const ctx = useContext(DesignCtx);
  if (!ctx) throw new Error("useDesign must be used inside <DesignProvider>");
  return ctx;
};
