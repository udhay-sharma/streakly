import { Plus } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { runStoreTests } from "@/store/storeTestRunner";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const hasRunTests = useRef(false);
  const { themePreference, setThemePreference } = useTheme();

  useEffect(() => {
    if (hasRunTests.current) return;
    hasRunTests.current = true;
    runStoreTests().catch(console.error);
  }, []);

  return (
    <>
      <View className="flex-1 bg-background px-6 pt-16">
        {/* Header */}
        <Text className="text-4xl font-bold text-text">
          Theme Tester 🎨
        </Text>

        <Text className="mt-2 text-textSecondary">
          Phase 3 Theme Foundation
        </Text>

        <Card className="mt-8 gap-4">
          <Text className="text-xl font-bold text-text">
            Manual Override
          </Text>
          <Text className="text-textSecondary">
            Current setting: {themePreference}
          </Text>
          
          <View className="flex-row justify-between mt-2">
            <Button
              label="Light"
              variant={themePreference === 'light' ? 'default' : 'outline'}
              onPress={() => setThemePreference('light')}
              className="flex-1 mr-2"
            />
            <Button
              label="Dark"
              variant={themePreference === 'dark' ? 'default' : 'outline'}
              onPress={() => setThemePreference('dark')}
              className="flex-1 mr-2"
            />
            <Button
              label="System"
              variant={themePreference === 'system' ? 'default' : 'outline'}
              onPress={() => setThemePreference('system')}
              className="flex-1"
            />
          </View>
        </Card>

        {/* Floating button */}
        <Pressable
          onPress={() => setShowModal(true)}
          className="absolute bottom-24 right-8 h-16 w-16 items-center justify-center rounded-full bg-primary active:opacity-80"
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
          <View className="rounded-t-3xl bg-surface p-6">
            <Text className="mb-5 text-2xl font-bold text-text">
              Test Modal
            </Text>

            <TextInput
              placeholder="Test input"
              placeholderTextColor="var(--text-secondary)"
              className="rounded-xl bg-background p-4 text-text border border-border"
            />

            <Button
              label="Confirm"
              onPress={() => setShowModal(false)}
              className="mt-4"
            />

            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setShowModal(false)}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}