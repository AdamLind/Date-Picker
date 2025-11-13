import {
  Pressable,
  TextInput,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import {useRef, useState, useEffect, useCallback} from "react"; // Added useCallback
import {useRouter, useNavigation} from "expo-router";

// --- CLIENT-SIDE INTERFACES (Must match API server.ts) ---
interface DateIdea {
  idea_id: number;
  title: string;
  activity_type: "STAY_IN" | "GO_OUT";
  est_price_per_person: string;
  creator_username: string | null;
}

const API_HOST = "http://192.168.86.56:3000";
const IDEA_URL = `${API_HOST}/api/ideas`;

const formatPrice = (priceString: string): string => {
  const price = parseFloat(priceString);
  return isNaN(price) || price === 0 ? "Free" : `$${price.toFixed(2)}`;
};

export default function ExploreScreen() {
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const navigation = useNavigation();

  // --- Data Fetching Logic ---

  // 1. Wrap fetchIdeas in useCallback for dependency array stability
  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(IDEA_URL);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data: DateIdea[] = await response.json();
      setIdeas(data);
    } catch (e: any) {
      console.error("Failed to fetch ideas:", e);
      setError(
        `Failed to load ideas. Check API server (npx ts-node server.ts). Error: ${e.message}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // The function itself doesn't depend on external props/state

  // 2. Use the 'focus' listener to refetch data
  useEffect(() => {
    // When the screen focuses (when navigated back to), run fetchIdeas
    const unsubscribe = navigation.addListener("focus", fetchIdeas);

    // Run once immediately when the component mounts as well
    // NOTE: This replaces the initial empty dependency array []
    fetchIdeas();

    // Clean up the listener when the component is unmounted
    return unsubscribe;
  }, [router, fetchIdeas]); // Dependencies: router and the memoized fetchIdeas

  // --- Render Functions ---
  const renderIdea = ({item}: {item: DateIdea}) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/detail/[id]",
          params: {
            id: item.idea_id.toString(),
            idea: JSON.stringify(item),
          },
        })
      }
      className="bg-white p-4 rounded-xl shadow-md mb-3 border border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-800 flex-shrink pr-2">
          {item.title}
        </Text>
        <View
          className={`px-3 py-1 rounded-full ${
            item.activity_type === "STAY_IN" ? "bg-amber-400" : "bg-emerald-400"
          }`}
        >
          <Text className="text-xs font-semibold text-gray-800">
            {item.activity_type.replace("_", " ")}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between pt-1 border-t border-gray-100">
        <Text className="text-sm text-gray-500">
          Cost:{" "}
          <Text className="font-semibold text-gray-700">
            {formatPrice(item.est_price_per_person)}
          </Text>
        </Text>
        <Text className="text-sm text-gray-500">
          Creator:{" "}
          <Text className="font-semibold text-gray-700">
            {item.creator_username || "System"}
          </Text>
        </Text>
      </View>
    </Pressable>
  );

  // --- Content Display ---
  const renderContent = () => {
    // ... (Loading, Error, No Ideas handling remains the same) ...
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-600 mt-3">Loading ideas from API...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-start items-center p-4 bg-red-100 rounded-lg m-4">
          <Text className="text-lg font-bold text-red-700 mb-2">
            API Connection Failed
          </Text>
          <Text className="text-sm text-red-600 text-center">{error}</Text>
        </View>
      );
    }

    if (ideas.length === 0) {
      return (
        <View className="flex-1 justify-start items-center p-4">
          <Text className="text-lg font-bold text-gray-600 mt-5">
            No Ideas Found
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            Start by adding some new ideas to the database!
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1">
        <FlatList
          data={ideas}
          keyExtractor={(item) => `idea-${item.idea_id}`}
          renderItem={renderIdea}
          // Optional: Add pull-to-refresh
          onRefresh={fetchIdeas}
          refreshing={isLoading}
        />
      </View>
    );
  };

  return (
    <View className="flex flex-1 justify-start items-center pt-[50px] px-5">
      {/* Search Bar UI */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="m-[10px] rounded-full bg-white text-black w-full h-12 px-[10px]"
      >
        <View className="flex flex-row items-center h-full rounded-lg px-[10px] gap-2">
          <Ionicons name="search-sharp" size={20} color="#888" />
          <TextInput
            ref={inputRef}
            className="flex-1 text-gray-800"
            placeholder="What sounds fun?"
            placeholderTextColor="#4b4b4bff"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </Pressable>

      {/* Header and Add Button */}
      <View className="w-full flex-row justify-between items-center mt-2 mb-2">
        <Text className="text-lg font-bold text-green-700">
          Public Date Ideas
        </Text>
        <Pressable
          // Navigate to the create screen
          onPress={() => router.push("/create")}
          className="bg-indigo-500 p-2 rounded-lg flex-row items-center"
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text className="text-white font-semibold ml-1">Add New</Text>
        </Pressable>
      </View>

      {/* List Content */}
      <View className="flex flex-1 w-full bg-gray-50 p-2 rounded-lg">
        {renderContent()}
      </View>
    </View>
  );
}
