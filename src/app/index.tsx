import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B0F14",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 38,
          fontWeight: "700",
        }}
      >
        Streakly
      </Text>

      <Text
        style={{
          color: "#9CA3AF",
          marginTop: 10,
        }}
      >
        Build Better Habits
      </Text>
    </View>
  );
}