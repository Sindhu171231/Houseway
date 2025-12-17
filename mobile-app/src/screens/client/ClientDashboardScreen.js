import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  ActivityIndicator,
  TouchableOpacity 
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { projectsAPI, dashboardAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get("window");

export default function ClientDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [clientStats, setClientStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalMaterialRequests: 0,
    pendingMaterialRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("#F4F1ED");
  const dropZone = { x: width * 0.15, y: height * 0.35, w: width * 0.7, h: 160 };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!user || !user._id) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }

      console.log('[ClientDashboard] Fetching data for user:', user._id);
      
      // Fetch client stats, projects, and recent activities in parallel
      const [statsRes, projectsRes, activitiesRes] = await Promise.allSettled([
        dashboardAPI.getClientStats(),
        projectsAPI.getProjects({ client: user._id, limit: 50 }),
        dashboardAPI.getRecentActivity(5) // Get last 5 activities
      ]);

      // Process stats
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setClientStats(statsRes.value.data);
      } else if (statsRes.status === 'rejected') {
        console.error('Failed to fetch client stats:', statsRes.reason);
      }

      // Process projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value.success) {
        const projectsData = Array.isArray(projectsRes.value.data?.projects)
          ? projectsRes.value.data.projects
          : [];
        setProjects(projectsData);
      } else if (projectsRes.status === 'rejected') {
        console.error('Failed to fetch projects:', projectsRes.reason);
      }

      // Process recent activities
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.success) {
        setRecentActivities(activitiesRes.value.data.activities || []);
      } else if (activitiesRes.status === 'rejected') {
        console.error('Failed to fetch recent activities:', activitiesRes.reason);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C0A062" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: selectedColor}]}>
      <Text style={styles.header}>Moodboard Wall</Text>

      {/* Recent Activities Section */}
      <View style={[styles.activitiesSection, { top: 60, right: 20 }]}>
        <Text style={styles.activitiesTitle}>Recent Activity</Text>
        <View style={styles.activitiesList}>
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 3).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Text style={styles.activityText} numberOfLines={1}>{activity.message || activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>No recent activities</Text>
          )}
        </View>
      </View>

      {/* Example pinned note */}
      <View style={[styles.noteCard, { top: 140, left: 20, transform: [{ rotate: "-6deg" }] }]}>
        <Text style={styles.handwritten}>Color Palette</Text>
        <View style={styles.paletteRow}>
          {["#EAE7E1", "#D4C9B8", "#342F2A", "#C0A062"].map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[styles.paletteSwatch, { backgroundColor: color }]}
            />
          ))}
        </View>
      </View>

      {/* Vendor spotlight */}
      <View style={[styles.vendorCard, { top: 200, left: 20, transform: [{ rotate: "2deg" }] }]}>
        <Text style={styles.vendorTitle}>Vendor Spotlight</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Image
            source={{ uri: "https://logo.clearbit.com/rh.com" }}
            style={{ width: 60, height: 20, resizeMode: "contain", opacity: 0.7 }}
          />
          <Image
            source={{ uri: "https://logo.clearbit.com/arhaus.com" }}
            style={{ width: 60, height: 20, resizeMode: "contain", opacity: 0.7 }}
          />
        </View>
      </View>
      
      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>Note:</Text>
        <Text style={styles.noteText}>Check marble{"\n"}samples by Friday!</Text>
      </View>

      {/* Drop Zone */}
      <View style={styles.dropZone}>
        <Text style={styles.dropText}>Drag a project here</Text>
        <Text style={styles.dropSub}>to view details</Text>
      </View>

      {/* Dynamic Project Tiles */}
      {projects.map((project, i) => (
        <DraggableTile
          key={project._id}
          project={project}
          dropZone={dropZone}
          i={i}
        />
      ))}
    </GestureHandlerRootView>
  );
}

function DraggableTile({ project, dropZone, i }) {
  const navigation = useNavigation();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const dropped = useSharedValue(false);

  const rotation = (i % 2 === 0 ? 1 : -2) + Math.random() * 2;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(scale.value) },
      { rotate: `${rotation}deg` },
    ],
    opacity: dropped.value ? 0.95 : 1,
  }));

  const handleDrop = (x, y) => {
    const inside =
      x > dropZone.x &&
      x < dropZone.x + dropZone.w &&
      y > dropZone.y &&
      y < dropZone.y + dropZone.h;

    if (inside) {
      dropped.value = true;
      scale.value = 0.8;
      navigation.navigate("Projects", {
        screen: "ProjectDetails",
        params: { projectId: project._id },
      });
    } else {
      dropped.value = false;
      scale.value = 1;
    }
  };

  // Import Gesture here to avoid undefined error
  const Gesture = require('react-native-gesture-handler').Gesture;
  const GestureDetector = require('react-native-gesture-handler').GestureDetector;

  const pan = Gesture.Pan()
    .onStart(() => {
      scale.value = 0.9;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;

      const inside =
        e.absoluteX > dropZone.x &&
        e.absoluteX < dropZone.x + dropZone.w &&
        e.absoluteY > dropZone.y &&
        e.absoluteY < dropZone.y + dropZone.h;

      scale.value = inside ? 0.6 : 0.9;
    })
    .onEnd((e) => {
      runOnJS(handleDrop)(e.absoluteX, e.absoluteY);
    });

  // ✅ Grid layout instead of random positioning
  const cardWidth = 150;
  const cardHeight = 200;
  const baseTop = 300 + Math.floor(i / 2) * (cardHeight * 0.6); // 40% overlap
  const baseLeft = 20 + (i % 2) * (cardWidth * 0.7); // side shift

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.tile,
          {
            top: baseTop,
            left: baseLeft,
          },
          animatedStyle,
        ]}
      >
        <ImageBackground
          source={{ uri: project.images?.[0]?.url || project.thumbnail || "https://picsum.photos/200" }}
          style={styles.tileImage}
          imageStyle={{ borderRadius: 8 }}
        >
          <View style={styles.overlay}>
            <Text style={styles.tileTitle} numberOfLines={1}>{project.title}</Text>
            <Text style={styles.tileDesc} numberOfLines={2}>
              {project.description}
            </Text>
            <Text style={styles.tileStatus}>
              {project.status} • {project.budget ? `$${project.budget.toLocaleString()}` : 'Budget N/A'}
            </Text>
          </View>
        </ImageBackground>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F1ED",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "serif",
    color: "#342F2A",
  },
  dropZone: {
    position: "absolute",
    top: height * 0.35,
    left: width * 0.15,
    width: width * 0.7,
    height: 160,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(192,160,98,0.5)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dropText: { fontSize: 16, fontWeight: "600", color: "#342F2A", opacity: 0.6 },
  dropSub: { fontSize: 12, color: "#746C64", opacity: 0.5 },
  tile: {
    width: 150,
    height: 200,
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  tileImage: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 8,
  },
  tileText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  noteCard: {
    position: "absolute",
    width: 120,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  handwritten: {
    fontFamily: "Caveat-Regular",
    fontSize: 16,
    marginBottom: 6,
  },
  paletteRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  paletteSwatch: {
    width: 25,
    height: 25,
    borderRadius: 4,
  },
  vendorCard: {
    position: "absolute",
    width: 140,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  vendorTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    color: "#342F2A",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)", // dark overlay for readability
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 6,
  },
  tileTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  tileDesc: {
    color: "#eee",
    fontSize: 12,
  },
  tileStatus: {
    color: "#C0A062",
    fontSize: 11,
    marginTop: 2,
  },
  activitiesSection: {
    position: 'absolute',
    width: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#342F2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  activitiesList: {
    gap: 6,
  },
  activityItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  activityText: {
    fontSize: 12,
    color: '#342F2A',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 10,
    color: '#746C64',
    marginTop: 2,
  },
  noActivityText: {
    fontSize: 12,
    color: '#746C64',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noteBox: {
  position: "absolute",
  top: 100,
  right: 20,
  width: 140,
  height: 120,
  backgroundColor: "#fff",
  borderRadius: 6,
  padding: 10,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 5,
  shadowOffset: { width: 2, height: 2 },
  elevation: 4,
  transform: [{ rotate: "-5deg" }], // 👈 makes it feel like a pinned sticky note
},
noteTitle: {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 6,
  color: "#342F2A",
  fontFamily:"Noteworthy-Bold",
},
noteText: {
  fontSize: 13,
  lineHeight: 18,
  color: "#444",
  fontFamily:"Bradley Hand",
}
});