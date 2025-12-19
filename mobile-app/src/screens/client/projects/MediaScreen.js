// MediaScreen.js
import React, { useState, useEffect, useRef } from "react";
import { Video } from "expo-av";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { projectsAPI } from "../../../utils/api";

export default function MediaScreen() {
  const route = useRoute();
  const { projectId } = route.params || {};

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [mediaData, setMediaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const highlights = mediaData.filter((item) => item.type === "photo");
  const screenWidth = Dimensions.get("window").width;
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);

  // Fetch project media
  useEffect(() => {
    if (projectId) {
      loadProjectMedia();
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'No project selected');
    }
  }, [projectId]);

  const loadProjectMedia = async () => {
    try {
      setIsLoading(true);
      console.log('[MediaScreen] Loading media for project:', projectId);

      // Fetch project data which includes images and documents
      const response = await projectsAPI.getProjectById(projectId);
      console.log('[MediaScreen] Project API response:', response);

      if (response.success && response.data.project) {
        const project = response.data.project;

        // Combine images and documents from project data
        let allMedia = [];

        // Process images
        if (project.images && Array.isArray(project.images)) {
          const imageMedia = project.images.map((image, index) => ({
            id: `image-${index}`,
            type: 'photo',
            title: image.name || 'Project Image',
            subtitle: image.type || 'Image',
            date: image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            image: image.url ? `http://192.168.1.5:5000${image.url}` : null,
            thumbnail: image.url ? `http://192.168.1.5:5000${image.url}` : null,
            fileUrl: image.url ? `http://192.168.1.5:5000${image.url}` : null,
            uploadedBy: image.uploadedBy,
            uploadedAt: image.uploadedAt,
          }));
          allMedia = [...allMedia, ...imageMedia];
        }

        // Process documents
        if (project.documents && Array.isArray(project.documents)) {
          const documentMedia = project.documents.map((doc, index) => ({
            id: `doc-${index}`,
            type: 'document',
            title: doc.name || 'Project Document',
            subtitle: doc.type || 'Document',
            date: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            image: null,
            thumbnail: null,
            fileUrl: doc.url ? `http://192.168.1.5:5000${doc.url}` : null,
            uploadedBy: doc.uploadedBy,
            uploadedAt: doc.uploadedAt,
          }));
          allMedia = [...allMedia, ...documentMedia];
        }

        // Sort by upload date (newest first)
        allMedia.sort((a, b) => {
          const dateA = new Date(a.uploadedAt || 0);
          const dateB = new Date(b.uploadedAt || 0);
          return dateB - dateA;
        });

        console.log('[MediaScreen] Combined media data:', allMedia);
        setMediaData(allMedia);
      } else {
        console.log('[MediaScreen] No project data found or API error:', response.message);
        setMediaData([]);
      }
    } catch (error) {
      console.error('Error loading project media:', error);
      Alert.alert('Error', `Failed to load project media: ${error.message || 'Unknown error'}`);
      setMediaData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll highlights
  useEffect(() => {
    const interval = setInterval(() => {
      if (flatListRef.current && highlights.length > 0) {
        let nextIndex = (currentIndexRef.current + 1) % highlights.length;
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        currentIndexRef.current = nextIndex;
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [highlights.length]);

  const getItemLayout = (_, index) => ({
    length: screenWidth * 0.85 + 20,
    offset: (screenWidth * 0.85 + 20) * index,
    index,
  });

  // Mapping tabs to actual type values
  const typeMap = {
    All: "all",
    Photos: "photo",
    Videos: "video",
    Documents: "document",
  };

  const filteredData =
    activeFilter === "All"
      ? mediaData
      : mediaData.filter((item) => item.type === typeMap[activeFilter]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#d4bda5" />
        <Text style={styles.loadingText}>Loading media...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Highlights */}
        <Text style={styles.sectionHeader}>Milestone Highlights</Text>
        <FlatList
          ref={flatListRef}
          data={highlights}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.highlightCard, { width: screenWidth * 0.85 }]}
              onPress={() => {
                setSelectedMedia(item);
                setGalleryVisible(true);
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.highlightImage}
                onError={(error) => {
                  console.log('Highlight image load error for:', item.image, error);
                }}
              />
              <View style={styles.overlay} />
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.highlightDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          )}
          onMomentumScrollEnd={(ev) => {
            const offsetX = ev.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / (screenWidth * 0.85 + 20));
            currentIndexRef.current = index;
          }}
        />

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {["All", "Photos", "Videos", "Documents"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterButton,
                activeFilter === tab && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === tab && styles.activeFilterText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Media Grid */}
        <View style={styles.grid}>
          {filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} available</Text>
              <Text style={styles.emptySubtext}>Media will appear here once uploaded to the project</Text>
            </View>
          ) : (
            filteredData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => {
                  if (item.type === "document") {
                    Linking.openURL(item.fileUrl);
                  } else {
                    setSelectedMedia(item);
                    setGalleryVisible(true);
                  }
                }}
              >
                {item.type === "photo" && (
                  <View style={styles.gridImageContainer}>
                    {item.imageLoadError ? (
                      // Fallback when image fails to load
                      <View style={[styles.gridImage, styles.imageFallback]}>
                        <Ionicons name="image-outline" size={40} color="#ccc" />
                        <Text style={styles.fallbackText}>{item.title}</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.gridImage}
                        onError={(error) => {
                          console.log('Image load error for:', item.image, error);
                          // Set error state for fallback handling
                          setMediaData(prevData =>
                            prevData.map(mediaItem =>
                              mediaItem.id === item.id
                                ? { ...mediaItem, imageLoadError: true }
                                : mediaItem
                            )
                          );
                        }}
                      />
                    )}
                  </View>
                )}
                {item.type === "video" && (
                  <View style={styles.videoItem}>
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={styles.gridImage}
                      onError={(error) => {
                        console.log('Thumbnail load error for:', item.thumbnail, error);
                      }}
                    />
                    <Ionicons
                      name="play-circle"
                      size={40}
                      color="white"
                      style={styles.playIcon}
                    />
                  </View>
                )}
                {item.type === "document" && (
                  <View style={styles.docItem}>
                    <Ionicons name="document-text-outline" size={40} color="#fff" />
                    <Text style={styles.docText}>{item.title}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={galleryVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setGalleryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedMedia && (
            <View style={styles.modalContent}>
              {selectedMedia.type === "photo" && (
                <Image
                  source={{ uri: selectedMedia.image }}
                  style={styles.modalImage}
                />
              )}
              {selectedMedia.type === "video" && (
                <Video
                  source={{ uri: selectedMedia.videoUrl }}
                  style={styles.modalImage}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}
              {selectedMedia.type === "document" && (
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  (Open Document: {selectedMedia.title})
                </Text>
              )}
              <View style={styles.modalDetails}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedMedia.title}</Text>
                    <Text style={styles.modalDate}>{selectedMedia.date}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setGalleryVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>{selectedMedia.subtitle}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const COLORS = {
  primary: '#B8860B',        // Dark Golden Rod
  primaryLight: 'rgba(184, 134, 11, 0.15)',
  background: '#F5F5F0',     // Beige
  cardBg: '#FFFFFF',         // White
  cardBorder: 'rgba(184, 134, 11, 0.1)',
  text: '#1A1A1A',           // Dark text
  textMuted: '#666666',      // Muted text
  accent: '#E6D7BB',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "800",
    marginHorizontal: 20,
    marginVertical: 15,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  highlightCard: {
    height: 220,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  highlightImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  highlightText: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  highlightTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  highlightDate: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 25,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: 15,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridImageContainer: {
    flex: 1,
  },
  imageFallback: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    color: COLORS.primary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  videoItem: {
    flex: 1,
    backgroundColor: "#000",
  },
  playIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  docItem: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  docText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    height: "80%",
    backgroundColor: "#000",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalImage: {
    width: "100%",
    height: "75%",
    resizeMode: "contain",
  },
  modalDetails: {
    padding: 24,
    backgroundColor: COLORS.cardBg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalDate: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.text,
    fontWeight: "300",
  },
  modalSubtitle: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
