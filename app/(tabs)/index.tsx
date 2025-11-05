import DateTimePicker from "@react-native-community/datetimepicker";
import React, {useEffect, useState} from "react";
import {Pressable, ScrollView, StyleSheet, Text, View} from "react-native";

export default function HomeScreen() {
  const [greeting, setGreeting] = useState("");
  const [activityType, setActivityType] = useState("Date");
  const [locationType, setLocationType] = useState("Stay In");
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const currentTime = new Date().getHours();

  useEffect(() => {
    if (currentTime >= 5 && currentTime < 12) {
      setGreeting("Good Morning");
    } else if (currentTime >= 12 && currentTime < 17) {
      setGreeting("Good Afternoon");
    } else if (currentTime >= 17 && currentTime < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night");
    }
  }, []);

  const socialLevel = ["Date", "Group-Date", "Activity"];
  const locations = ["Stay In", "Go Out"];

  const handleSelectActivityType = (activity: string) => {
    setActivityType(activity);
  };

  const handleSelectLocationType = (location: string) => {
    setLocationType(location);
  };

  const showStartDatePicker = () => setShowStartPicker(true);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;  // Use the selected date or the current date
    setShowStartPicker(false);  // Close the date picker after selection
    setStartDate(currentDate);  // Update the state with the new date
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="justify-start items-center h-full"
    >
      <View className="w-full bg-gray-700 rounded-b-4xl p-5 pt-15">
        <Text className="text-white font-bold w-full text-3xl">{greeting}</Text>
        <View className="mt-[30px] mb-[25px] px-[5px]">
          <View className="flex-col gap-[25px]">
            <View className="flex flex-row items-center justify-around ">
              {socialLevel.map((activity) => (
                <Pressable
                  key={activity}
                  onPress={() => handleSelectActivityType(activity)}
                >
                  <Text
                    className={`w-32 text-[18px] text-gray-300 text-center ${
                      activityType === activity
                        ? "font-semibold text-white"
                        : ""
                    }`}
                  >
                    {activity}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="w-full flex flex-col gap-[15px]">
              <View className="flex flex-row items-center justify-center gap-[34px] w-full">
                {locations.map((location) => (
                  <Pressable
                    className={`flex-grow p-[13px] m-auto border border-gray rounded-[10px] bg-gray-800 ${
                      locationType === location ? "border-white" : ""
                    }`}
                    key={location}
                    onPress={() => handleSelectLocationType(location)}
                  >
                    <Text
                      className={`h-6 text-[18px] text-gray-300 text-center ${
                        locationType === location ? "text-white" : ""
                      }`}
                    >
                      {location}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                  />
                )}
                <Pressable onPress={showStartDatePicker} className="bg-gray-800 w-full h-[50px] rounded-t-lg border border-gray-500 border-b-0"></Pressable>
                <View className="w-full border-t border-gray-500"></View>
                <View className="bg-gray-800 w-full h-[50px] rounded-b-lg border border-gray-500 border-t-0"></View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainSearchArea: {
    flex: 1,
    width: "100%",
    height: "auto",
    backgroundColor: "#185e63ff",
  },
});
