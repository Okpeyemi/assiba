import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import CallsScreen from "./src/screens/CallsScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assiba</Text>
        <Text style={styles.headerSub}>Appels manqués</Text>
      </View>
      <CallsScreen />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#6200EE" },
  header: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { color: "#FFF", fontSize: 26, fontWeight: "800" },
  headerSub: { color: "#CE93D8", fontSize: 13, marginTop: 2 },
});
