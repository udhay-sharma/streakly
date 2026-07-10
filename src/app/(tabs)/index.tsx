import { View, Text, Pressable } from "react-native";
import * as Progress from "react-native-progress";
import { Plus } from "lucide-react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-[#0B0F14] px-6 pt-16">
      <Text className="text-4xl font-bold text-white">
        Good afternoon 👋
      </Text>

      <Text className="mt-2 text-gray-400">
        Keep your streak alive.
      </Text>

      <View className="mt-8 rounded-3xl bg-[#111827] p-6">
        <Text className="text-3xl font-bold text-white">
          🔥 12 days
        </Text>

        <Text className="mt-2 text-gray-400">
          Current streak
        </Text>
      </View>

      <View className="mt-8">
        <Text className="mb-3 text-lg text-white">
          Today's progress
        </Text>

        <Progress.Bar
          progress={0.6}
          width={null}
        />

        <Text className="mt-2 text-gray-400">
          3 of 5 habits completed
        </Text>
      </View>

      <View className="mt-8">
        <Text className="mb-4 text-xl font-bold text-white">
          Today's habits
        </Text>

        <View className="mb-3 rounded-2xl bg-[#111827] p-5">
          <Text className="text-white">💧 Drink water</Text>
        </View>

        <View className="mb-3 rounded-2xl bg-[#111827] p-5">
          <Text className="text-white">🏋️ Workout</Text>
        </View>

        <View className="rounded-2xl bg-[#111827] p-5">
          <Text className="text-white">📚 Read 20 pages</Text>
        </View>
      </View>

      <Pressable className="absolute bottom-8 right-8 h-16 w-16 items-center justify-center rounded-full bg-indigo-500">
        <Plus color="white" size={30} />
      </Pressable>
    </View>
  );
}