import {Pressable, ScrollView, StyleSheet, TextInput, View} from "react-native";

import {ThemedView} from "@/components/ThemedView";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import {useRef, useState} from "react";

export default function TabTwoScreen() {
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 50,
        paddingHorizontal: 20,
      }}
    >
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={styles.container}
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-sharp"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="What sounds fun?"
            placeholderTextColor="#4b4b4bff"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
            }}
          />
        </View>
      </Pressable>
      <ScrollView style={styles.mainContentArea}>{}</ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: {
    margin: 10,
    borderRadius: 9999,
    backgroundColor: "#ffffffff",
    color: "#000000ff",
    width: "100%",
    height: 48,
    paddingHorizontal: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    height: "100%",
    width: "100%",
    fontSize: 16,
    color: "#000000ff",
  },
  mainContentArea: {
    flex: 1,
    width: "100%",
    backgroundColor: "#185e63ff",
  },
});
