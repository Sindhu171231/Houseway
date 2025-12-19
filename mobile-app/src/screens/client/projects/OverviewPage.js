import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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

      {/* Meet the Team */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Meet Your Design Team</Text>
      {project.assignedEmployees && project.assignedEmployees.map((member, index) => (
        <View key={index} style={styles.teamMemberCard}>
          <View style={styles.teamAvatar}>
            <Text style={styles.avatarText}>{member.firstName?.[0]}{member.lastName?.[0]}</Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{member.firstName} {member.lastName}</Text>
            <Text style={styles.teamRole}>{member.employeeDetails?.position || 'Project Designer'}</Text>
          </View>
          <TouchableOpacity style={styles.contactIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#9B59B6" />
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const COLORS = {
  primary: '#f1d794ff',        // Dark Golden Rod
  primaryLight: 'rgba(184, 134, 11, 0.15)',
  background: '#F5F5F0',     // Beige
  cardBg: '#FFFFFF',         // White
  cardBorder: 'rgba(184, 134, 11, 0.1)',
  text: '#1A1A1A',           // Dark text
  textMuted: '#666666',      // Muted text
  success: '#388E3C',
  warning: '#F57C00',
  danger: '#D32F2F',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 150,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
    fontWeight: '500',
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  progressBadge: {
    backgroundColor: 'rgba(56, 142, 60, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.success,
  },
  activityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activityTextBox: {
    flex: 1,
    marginLeft: 16,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  activitySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tagBlue: {
    fontSize: 11,
    color: COLORS.cardBg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    fontWeight: '700',
  },
  teamMemberCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  teamAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  teamInfo: {
    flex: 1,
    marginLeft: 16,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  teamRole: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  contactIcon: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
});
