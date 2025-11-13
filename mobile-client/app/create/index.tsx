import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
// No Ionicons needed for delete, but we keep the imports clean

const API_HOST = 'http://192.168.86.56:3000'; // **VERIFY THIS IP IS CORRECT**
const IDEA_URL = `${API_HOST}/api/ideas`;

export default function CreateIdeaScreen() {
    const router = useRouter();
    // Initial state is empty for a new item
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('0');
    const [type, setType] = useState<'STAY_IN' | 'GO_OUT'>('GO_OUT'); // Default to GO_OUT
    const [creator, setCreator] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);

    // --- Helper Functions ---
    const formatInputPrice = (value: string): string => {
        const cleaned = value.replace(/[^0-9.]/g, ''); 
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            return `${parts[0]}.${parts.slice(1).join('')}`;
        }
        return cleaned;
    };

    // --- API Function (POST) ---

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a title for the idea.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(IDEA_URL, { // POST request to the base URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title, 
                    est_price_per_person: price, 
                    activity_type: type,
                    creator_username: creator.trim() || null, // Send null if empty
                }),
            });

            if (!response.ok) throw new Error("Failed to create idea");

            Alert.alert("Success", "New date idea created!");
            
            // Go back to the Explore screen
            router.back(); 
        } catch (e) {
            console.error("Creation failed:", e);
            Alert.alert("Error", "Could not create idea. Check API.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-5">
            <Text className="text-2xl font-bold text-gray-800 mb-6">Propose a New Date Idea</Text>

            {/* Title Input */}
            <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">Idea Title</Text>
                <TextInput
                    className="border border-gray-300 p-3 rounded-lg text-lg"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="E.g., Take a Cooking Class"
                />
            </View>

            {/* Price Input */}
            <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">Estimated Price Per Person ($)</Text>
                <TextInput
                    className="border border-gray-300 p-3 rounded-lg text-lg"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={(text) => setPrice(formatInputPrice(text))}
                    placeholder="0.00"
                />
            </View>
            
            {/* Creator Input */}
            <View className="mb-6">
                <Text className="text-sm text-gray-500 mb-1">Your Name (Optional)</Text>
                <TextInput
                    className="border border-gray-300 p-3 rounded-lg text-lg"
                    value={creator}
                    onChangeText={setCreator}
                    placeholder="Your Username"
                />
            </View>

            {/* Activity Type Selection */}
            <View className="mb-8">
                <Text className="text-sm text-gray-500 mb-2">Activity Type</Text>
                <View className="flex-row justify-around">
                    <Pressable
                        onPress={() => setType('STAY_IN')}
                        className={`px-6 py-3 rounded-full border-2 ${type === 'STAY_IN' ? 'bg-amber-400 border-amber-500' : 'bg-white border-gray-300'}`}
                    >
                        <Text className={`font-semibold ${type === 'STAY_IN' ? 'text-gray-800' : 'text-gray-600'}`}>STAY IN</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setType('GO_OUT')}
                        className={`px-6 py-3 rounded-full border-2 ${type === 'GO_OUT' ? 'bg-emerald-400 border-emerald-500' : 'bg-white border-gray-300'}`}
                    >
                        <Text className={`font-semibold ${type === 'GO_OUT' ? 'text-gray-800' : 'text-gray-600'}`}>GO OUT</Text>
                    </Pressable>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#4F46E5" className="mt-4" />
            ) : (
                <Pressable
                    onPress={handleCreate}
                    className="bg-indigo-600 p-4 rounded-xl shadow-md flex-row justify-center"
                >
                    <Text className="text-white text-lg font-bold">Submit New Idea</Text>
                </Pressable>
            )}
        </ScrollView>
    );
}