import { Plus } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { runDbTests } from "@/db/testRunner";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const hasRunTests = useRef(false);

  useEffect(() => {
    if (hasRunTests.current) return;
    hasRunTests.current = true;
    runDbTests().catch(console.error);
  }, []);

  return (
    <>
      <View className="flex-1 bg-[#0B0F14] px-6 pt-16">
        {/* Header */}
        <Text className="text-4xl font-bold text-white">
          Good afternoon 👋
        </Text>

        <Text className="mt-2 text-gray-400">
          Keep your streak alive.
        </Text>

        {/* Streak card */}
        <View className="mt-8 rounded-3xl bg-[#111827] p-6">
          <Text className="text-3xl font-bold text-white">
            🔥 12 days
          </Text>

          <Text className="mt-2 text-gray-400">
            Current streak
          </Text>
        </View>

        {/* Progress */}
        <View className="mt-8">
          <Text className="mb-3 text-lg text-white">
            Today's progress
          </Text>

          <View className="h-3 w-full rounded-full bg-gray-800">
            <View className="h-3 w-3/5 rounded-full bg-indigo-500" />
          </View>

          <Text className="mt-2 text-gray-400">
            3 of 5 habits completed
          </Text>
        </View>

        {/* Habits */}
        <View className="mt-8">
          <Text className="mb-4 text-xl font-bold text-white">
            Today's habits
          </Text>

          <View className="mb-3 rounded-2xl bg-[#111827] p-5">
            <Text className="text-white">
              💧 Drink water
            </Text>
          </View>

          <View className="mb-3 rounded-2xl bg-[#111827] p-5">
            <Text className="text-white">
              🏋️ Workout
            </Text>
          </View>

          <View className="rounded-2xl bg-[#111827] p-5">
            <Text className="text-white">
              📚 Read 20 pages
            </Text>
          </View>
        </View>

        {/* Floating button */}
        <Pressable
          onPress={() => setShowModal(true)}
          className="absolute bottom-24 right-8 h-16 w-16 items-center justify-center rounded-full bg-indigo-500"
        >
          <Plus color="white" size={30} />
        </Pressable>
      </View>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-[#111827] p-6">
            <Text className="mb-5 text-2xl font-bold text-white">
              New Habit
            </Text>

            <TextInput
              placeholder="Habit name"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl bg-[#0B0F14] p-4 text-white"
            />

            <Pressable
              onPress={() => setShowModal(false)}
              className="mt-4 rounded-xl bg-indigo-500 p-4"
            >
              <Text className="text-center font-bold text-white">
                Create Habit
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowModal(false)}
              className="mt-3 rounded-xl border border-gray-700 p-4"
            >
              <Text className="text-center text-gray-300">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}