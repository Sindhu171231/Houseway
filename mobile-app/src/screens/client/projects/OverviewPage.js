import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DynamicElevatorTimeline from "./TimelineScreen";
import { projectsAPI } from "../../../utils/api"; // adjust path if needed

export default function ProjectOverview({ route, navigation }) {
  const { projectId } = route?.params || {};
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(" Route :", route);
    console.log("🟡 Route params:", route?.params);
    console.log("🟡 Extracted projectId:", projectId);

    if (!projectId) {
      console.warn("⚠️ No projectId passed to ProjectOverview");
      setLoading(false);
      return;
    }

    const loadProject = async () => {
      try {
        console.log(`📡 Fetching project with ID: ${projectId}`);
        const res = await projectsAPI.getProjectById(projectId);
        console.log("🟢 API Response:", res.data);

        setProject(res.data?.project || null);
      } catch (err) {
        console.error("🔴 Error loading project details:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  if (loading) {
    console.log("⏳ Still loading...");
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9B59B6" />
        <Text style={{ marginTop: 10 }}>Loading project...</Text>
      </View>
    );
  }

  if (!project) {
    console.log("⚠️ No project found after loading");
    return (
      <View style={styles.centered}>
        <Text>No project found</Text>
      </View>
    );
  }

  console.log("✅ Rendering project:", project.title);

  return (
    <ScrollView style={styles.container}>
      {/* Project Header Card */}
      <View style={styles.card}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.subtitle}>
          {project.location?.city && project.location?.state 
            ? `${project.location.city}, ${project.location.state}` 
            : project.location?.address || "Location not specified"}
        </Text>

        <View style={styles.rowBetween}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{project.status}</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#555" />
            <Text style={styles.dateText}>
              {project.startDate} → {project.endDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Project Timeline */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Project Timeline</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {project.progress?.percentage || 0}% Completed
            </Text>
          </View>
        </View>

        <DynamicElevatorTimeline timeline={project.timeline || []} />
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      {(project.activities || []).map((activity, index) => (
        <View key={index} style={styles.activityCard}>
          <Ionicons name={activity.icon || "document-text-outline"} size={26} color="#3498DB" />
          <View style={styles.activityTextBox}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activitySub}>{activity.date}</Text>
          </View>
          <Text style={styles.tagBlue}>{activity.tag}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7EF",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#E8F9E9",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  statusText: {
    color: "#27AE60",
    fontSize: 13,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2C3E50",
  },
  progressBadge: {
    backgroundColor: "#DFF6E6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#27AE60",
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  activityTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  activitySub: {
    fontSize: 12,
    color: "#888",
  },
  tagBlue: {
    fontSize: 12,
    color: "white",
    backgroundColor: "#3498DB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
});
