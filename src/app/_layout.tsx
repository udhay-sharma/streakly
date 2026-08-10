import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { initDatabase } from "@/db/database";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "nativewind";

export default function RootLayout() {
  const { activeTheme } = useTheme();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  useEffect(() => {
    setColorScheme(activeTheme);
  }, [activeTheme, setColorScheme]);

  return (
    <>
      <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </>
  );
}