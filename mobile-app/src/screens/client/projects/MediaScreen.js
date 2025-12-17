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
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
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
                              ? {...mediaItem, imageLoadError: true}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F1ED",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "700",
    marginHorizontal: 20,
    marginVertical: 15,
    color: "#342F2A",
  },
  highlightCard: {
    height: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  highlightImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  highlightText: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  highlightTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  highlightDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10, // Add space above the filter row
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#EAE7E1",
  },
  activeFilterButton: {
    backgroundColor: "#C0A062",
  },
  filterText: {
    fontSize: 14,
    color: "#342F2A",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10, // Add space above the grid
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 5,
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
    backgroundColor: "#C0A062",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  docText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#342F2A",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#746C64",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },
  modalDetails: {
    padding: 15,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#342F2A",
  },
  modalDate: {
    fontSize: 14,
    color: "#746C64",
    marginTop: 2,
  },
  closeButton: {
    fontSize: 24,
    color: "#342F2A",
    fontWeight: "300",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#746C64",
  },
});
