import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { fetchCalls, markCallRead } from "../api/client";
import { usePushNotifications } from "../hooks/usePushNotifications";

const URGENCY_COLOR = { low: "#4CAF50", medium: "#FF9800", high: "#F44336" };
const URGENCY_LABEL = { low: "Faible", medium: "Moyen", high: "Urgent" };

export default function CallsScreen() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCalls();
      setCalls(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  usePushNotifications(() => {
    // Refresh list when a new notification arrives
    load();
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = useCallback(
    async (call) => {
      if (!call.read_at) {
        await markCallRead(call.id).catch(console.error);
        setCalls((prev) =>
          prev.map((c) =>
            c.id === call.id ? { ...c, read_at: new Date().toISOString() } : c
          )
        );
      }
    },
    []
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={calls}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>Aucun appel manqué</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.card, !item.read_at && styles.cardUnread]}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <Text style={styles.name}>
              {item.caller_name ?? item.caller_number ?? "Inconnu"}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: URGENCY_COLOR[item.urgency] },
              ]}
            >
              <Text style={styles.badgeText}>
                {URGENCY_LABEL[item.urgency]}
              </Text>
            </View>
          </View>
          {item.reason ? (
            <Text style={styles.reason}>{item.reason}</Text>
          ) : null}
          {item.callback_number ? (
            <Text style={styles.meta}>Rappel : {item.callback_number}</Text>
          ) : null}
          {item.summary ? (
            <Text style={styles.summary} numberOfLines={3}>
              {item.summary}
            </Text>
          ) : null}
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleString("fr-FR")}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#F5F5F5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { color: "#888", fontSize: 16 },
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: "#6200EE" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 17, fontWeight: "700", color: "#212121", flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  reason: { fontSize: 14, color: "#424242", marginTop: 6 },
  meta: { fontSize: 12, color: "#757575", marginTop: 4 },
  summary: { fontSize: 13, color: "#616161", marginTop: 8, fontStyle: "italic" },
  time: { fontSize: 11, color: "#9E9E9E", marginTop: 8, textAlign: "right" },
});
