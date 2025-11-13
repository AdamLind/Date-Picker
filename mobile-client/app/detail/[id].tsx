import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {useRouter, useLocalSearchParams} from "expo-router";
import {useState, useMemo} from "react";
import Ionicons from "@expo/vector-icons/build/Ionicons";

// --- CLIENT-SIDE INTERFACES (Assuming lat/long might be part of the full object) ---
interface DateIdea {
  idea_id: number;
  title: string;
  activity_type: "STAY_IN" | "GO_OUT";
  est_price_per_person: string;
  creator_username: string | null;
  // Assuming your database might hold these as part of the idea record
  latitude?: string | null;
  longitude?: string | null;
}

const API_HOST = "http://192.168.86.56:3000"; // **VERIFY THIS IP IS CORRECT**
const IDEA_URL = `${API_HOST}/api/ideas`;

export default function IdeaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialIdea: DateIdea = useMemo(() => {
    // ... (Your parsing logic remains here, unchanged) ...
    try {
      if (params.idea && typeof params.idea === "string") {
        return JSON.parse(params.idea) as DateIdea;
      }
      router.back();
      return {
        idea_id: -1,
        title: "",
        activity_type: "GO_OUT",
        est_price_per_person: "0",
        creator_username: null,
      };
    } catch (e) {
      console.error("Failed to parse idea param:", e);
      router.back();
      return {
        idea_id: -1,
        title: "",
        activity_type: "GO_OUT",
        est_price_per_person: "0",
        creator_username: null,
      };
    }
  }, [params.idea, router]);

  const [title, setTitle] = useState(initialIdea.title);
  const [price, setPrice] = useState(initialIdea.est_price_per_person);
  const [type, setType] = useState<"STAY_IN" | "GO_OUT">(
    initialIdea.activity_type
  );

  // 1. ADD STATE FOR LATITUDE AND LONGITUDE
  // Use optional chaining or safe fallback if initialIdea doesn't guarantee these fields
  const [latitude, setLatitude] = useState(initialIdea.latitude || "");
  const [longitude, setLongitude] = useState(initialIdea.longitude || "");

  const [isLoading, setIsLoading] = useState(false);

  // --- Helper Functions ---
  const formatInputPrice = (value: string): string => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join("")}`;
    }
    return cleaned;
  };

  // --- API Functions ---

  const handleSave = async () => {
    if (initialIdea.idea_id === -1) return Alert.alert("Error", "Invalid ID.");

    // Conditionally set location data based on activity type
    let finalLatitude = null;
    let finalLongitude = null;

    if (type === "GO_OUT") {
      // Trim whitespace and assign, ensuring an empty string becomes null
      finalLatitude = latitude.trim() || null;
      finalLongitude = longitude.trim() || null;

      if (!finalLatitude || !finalLongitude) {
        Alert.alert(
          "Missing Location",
          "Please enter both Latitude and Longitude for a 'GO OUT' activity."
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${IDEA_URL}/${initialIdea.idea_id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          title,
          est_price_per_person: price,
          activity_type: type,
          // 3. PASS LOCATION DATA CONDITIONALLY
          latitude: finalLatitude,
          longitude: finalLongitude,
        }),
      });

      if (!response.ok) throw new Error("Failed to update idea");

      Alert.alert("Success", "Date idea updated!");
      router.back();
    } catch (e) {
      console.error("Save failed:", e);
      Alert.alert("Error", "Could not save changes. Check API.");
    } finally {
      setIsLoading(false);
    }
  };

  // handleDelete remains unchanged...

  const handleDelete = () => {
    if (initialIdea.idea_id === -1)
      return Alert.alert("Error", "Invalid idea ID.");
    // ... (rest of handleDelete logic) ...
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${initialIdea.title}"?`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await fetch(
                `${IDEA_URL}/${initialIdea.idea_id}`,
                {
                  method: "DELETE",
                }
              );

              if (!response.ok) throw new Error("Failed to delete idea");

              Alert.alert("Deleted", "Date idea removed!");
              router.back();
            } catch (e) {
              console.error("Delete failed:", e);
              Alert.alert("Error", "Could not delete idea. Check API.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-white p-5">
      <Text className="text-2xl font-bold text-gray-800 mb-6">
        Edit Date Idea
      </Text>

      {/* Title Input */}
      <View className="mb-4">
        <Text className="text-sm text-gray-500 mb-1">Title</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg text-lg"
          value={title}
          onChangeText={setTitle}
          placeholder="E.g., Dinner and a Movie"
        />
      </View>

      {/* Price Input */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-1">
          Estimated Price Per Person ($)
        </Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg text-lg"
          keyboardType="numeric"
          value={price}
          onChangeText={(text) => setPrice(formatInputPrice(text))}
          placeholder="0.00"
        />
      </View>

      {/* Activity Type Selection */}
      <View className="mb-8">
        <Text className="text-sm text-gray-500 mb-2">Activity Type</Text>
        <View className="flex-row justify-around">
          <Pressable
            onPress={() => setType("STAY_IN")}
            className={`px-6 py-3 rounded-full border-2 ${
              type === "STAY_IN"
                ? "bg-amber-400 border-amber-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${
                type === "STAY_IN" ? "text-gray-800" : "text-gray-600"
              }`}
            >
              STAY IN
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setType("GO_OUT")}
            className={`px-6 py-3 rounded-full border-2 ${
              type === "GO_OUT"
                ? "bg-emerald-400 border-emerald-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${
                type === "GO_OUT" ? "text-gray-800" : "text-gray-600"
              }`}
            >
              GO OUT
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. CONDITIONAL LOCATION INPUT FIELDS */}
      {type === "GO_OUT" && (
        <View className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <Text className="text-base font-semibold text-gray-700 mb-3">
            Location Coordinates (Required)
          </Text>

          {/* Latitude Input */}
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Latitude</Text>
            <TextInput
              className="border border-gray-300 p-3 rounded-lg text-lg"
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
              placeholder="e.g., 34.0522"
            />
          </View>

          {/* Longitude Input */}
          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Longitude</Text>
            <TextInput
              className="border border-gray-300 p-3 rounded-lg text-lg"
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
              placeholder="e.g., -118.2437"
            />
          </View>
        </View>
      )}

      <Text className="text-sm text-gray-500 mb-6">
        Created By: **{initialIdea.creator_username || "System"}**
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4F46E5" className="mt-4" />
      ) : (
        <>
          <Pressable
            onPress={handleSave}
            className="bg-indigo-600 p-4 rounded-xl shadow-md flex-row justify-center mb-4"
          >
            <Text className="text-white text-lg font-bold">Save Changes</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            className="bg-red-500 p-4 rounded-xl shadow-md flex-row justify-center"
          >
            <Text className="text-white text-lg font-bold">
              <Ionicons name="trash-outline" size={20} color="white" /> Delete
              Idea
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
