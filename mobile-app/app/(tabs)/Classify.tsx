import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Modal, FlatList, Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL;;

const CITIES = [
  "Ahmedabad", "Bangalore", "Bhopal", "Bhubaneswar", "Chennai",
  "Dehradun", "Delhi", "Dharamsala", "Goa", "Gurugram",
  "Guwahati", "Hyderabad", "Indore", "Jaipur", "Kolkata",
  "Lucknow", "Mumbai", "Mysore", "Nagpur", "NCR",
  "Navi Mumbai", "Noida", "Pune", "Raipur", "Rajasthan",
  "Thane", "Trichy", "UP", "Visakhapatnam"
];

// Video URLs per class — only show if URL exists
const VIDEO_URLS: Record<string, string> = {
  Paper_Cardboard: "https://youtu.be/TF4xk6FjRCg?si=IRagU76y4LLyTB85",
  Glass: "https://youtube.com/shorts/V2P0K4l4JbU?si=yoDt9AeeY6CPyGp2",
  Metal: "https://youtube.com/shorts/1pc-6xcWBiA?si=T7fI6nTdppx7E_Nw",
  Metal_AluminumFoil: "https://youtube.com/shorts/tF7J2Ouklmc?si=EMCgR7Sm5Il1c2KP",
  Plastic: "https://youtube.com/shorts/NwFAuBopCP4?si=lausIiOqaY4ZgLsG",
  Mixed_Contaminated: "https://youtube.com/shorts/NwFAuBopCP4?si=lausIiOqaY4ZgLsG",
  // Ewaste, Organic_Waste, Textile — no URL
};

const CATEGORY_COLORS: Record<string, string> = {
  "E-Waste": "#1565c0",
  "Biodegradable": "#6d4c41",
  "Non-biodegradable": "#c62828",
  "Dry waste / recyclable": "#2e7d32",
  "Wet waste / compostable": "#6d4c41",
  "Reuse / donation / textile recycling": "#e65100",
  "General waste": "#555555",
};

export default function ClassifyScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });

    if (!pickerResult.canceled) {
      const asset = pickerResult.assets[0];
      setImage(asset.uri);
      setResult(null);
      await classifyImage(asset.uri);
    }
  };

  const classifyImage = async (uri: string) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'waste.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('city', selectedCity);

      const response = await fetch(`${API_URL}/api/classify`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
       console.log('Detected class:', data.detectedLabel);
    
      if (data.success) {
        setResult(data);
      } else {
        Alert.alert('Error', data.message || 'Classification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
   
  };

  const openVideo = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open video link.')
    );
  };

  // Get video URL for detected class
  // For Metal, show both metal URL and aluminum foil URL
  const getVideoUrls = (className: string): { label: string; url: string }[] => {
    if (className === 'Metal') {
      return [
        { label: '📹 How to recycle metal', url: VIDEO_URLS.Metal },
        { label: '📹 How to recycle aluminum foil', url: VIDEO_URLS.Metal_AluminumFoil },
      ];
    }
    const url = VIDEO_URLS[className];
    if (url) return [{ label: '📹 Watch How to Recycle', url }];
    return []; // no video for this class
  };

  const categoryColor = result ? (CATEGORY_COLORS[result.category] || '#555') : '#555';
  const videoUrls = result ? getVideoUrls(result.detectedLabel) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>♻️ Waste Wise</Text>
      <Text style={styles.subtitle}>Identify and recycle waste correctly</Text>

      {/* City Dropdown */}
      <Text style={styles.label}>Select Your City (optional)</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowCityPicker(true)}>
        <Text style={selectedCity ? styles.dropdownSelected : styles.dropdownPlaceholder}>
          {selectedCity || 'Select city for recycler locations...'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cityItemClear}
              onPress={() => { setSelectedCity(''); setShowCityPicker(false); }}
            >
              <Text style={styles.cityItemClearText}>Clear selection</Text>
            </TouchableOpacity>
            <FlatList
              data={CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, selectedCity === item && styles.cityItemSelected]}
                  onPress={() => { setSelectedCity(item); setShowCityPicker(false); }}
                >
                  <Text style={[styles.cityItemText, selectedCity === item && styles.cityItemTextSelected]}>
                    {item}
                  </Text>
                  {selectedCity === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Image Picker Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btnCamera} onPress={() => pickImage(true)}>
          <Text style={styles.btnText}>📷  Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGallery} onPress={() => pickImage(false)}>
          <Text style={styles.btnText}>🖼️  Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {image && <Image source={{ uri: image }} style={styles.previewImage} />}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Analyzing waste...</Text>
        </View>
      )}

      {/* Result */}
      {result && !loading && (
        <View style={[styles.resultCard, { borderLeftColor: categoryColor }]}>

          {/* Category Badge */}
          <View style={[styles.badge, { backgroundColor: categoryColor }]}>
            <Text style={styles.badgeText}>{result.wasteType}</Text>
          </View>

          <Text style={styles.detectedLabel}>
            Detected: <Text style={styles.bold}>{result.detectedLabel?.replace('_', ' ')}</Text>
          </Text>
          <Text style={styles.confidence}>Confidence: {result.confidence}%</Text>
          <Text style={styles.material}>Material: {result.material}</Text>
          <Text style={styles.category}>Category: {result.category}</Text>

          {/* Guidance */}
          <Text style={styles.sectionTitle}>♻️ How to Dispose:</Text>
          {result.guidance?.map((tip: string, i: number) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipNumber}>{i + 1}.</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}

          {/* Video Links — only shown if URL exists for this class */}
          {videoUrls.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {videoUrls.map((v, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.videoBox}
                  onPress={() => openVideo(v.url)}
                >
                  <Text style={styles.videoTitle}>{v.label}</Text>
                  <Text style={styles.videoLink}>Tap to open ↗</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Nearby Recyclers */}
          {result.locations?.length > 0 && (
            <View style={styles.locationsBox}>
              <Text style={styles.sectionTitle}>📍 Recyclers in {result.city}:</Text>
              {result.locations.map((loc: any, i: number) => (
                <Text key={i} style={styles.locationItem}>
                  • {loc.name} {loc.phone ? `(📞 ${loc.phone})` : ''}
                </Text>
              ))}
            </View>
          )}

          {/* Top 3 */}
          <View style={styles.top3Box}>
            <Text style={styles.top3Title}>Other possibilities:</Text>
            {result.top3?.map((item: any, i: number) => (
              <Text key={i} style={styles.top3Item}>
                • {item.class}: {item.confidence}%
              </Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 40, color: '#1b5e20' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#777', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, padding: 14, marginBottom: 16,
  },
  dropdownPlaceholder: { color: '#aaa', fontSize: 14 },
  dropdownSelected: { color: '#333', fontSize: 14, fontWeight: '500' },
  dropdownArrow: { color: '#777', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalClose: { fontSize: 20, color: '#777', padding: 4 },
  cityItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between' },
  cityItemSelected: { backgroundColor: '#e8f5e9' },
  cityItemText: { fontSize: 15, color: '#333' },
  cityItemTextSelected: { color: '#2e7d32', fontWeight: '600' },
  cityItemClear: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff8f8' },
  cityItemClearText: { color: '#c62828', fontSize: 14 },
  checkmark: { color: '#2e7d32', fontSize: 16, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnCamera: { flex: 1, backgroundColor: '#2e7d32', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnGallery: { flex: 1, backgroundColor: '#1565c0', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  previewImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16 },
  loadingBox: { alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 10, color: '#555', fontSize: 15 },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 5, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  badge: { borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  detectedLabel: { fontSize: 15, color: '#333', marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  confidence: { fontSize: 13, color: '#777', marginBottom: 2 },
  material: { fontSize: 13, color: '#555', marginBottom: 2 },
  category: { fontSize: 13, color: '#555', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 8 },
  tipRow: { flexDirection: 'row', marginBottom: 6, gap: 6 },
  tipNumber: { fontWeight: 'bold', color: '#2e7d32' },
  tipText: { flex: 1, color: '#444', fontSize: 14 },
  videoBox: { backgroundColor: '#e3f2fd', borderRadius: 8, padding: 12, marginBottom: 8 },
  videoTitle: { fontWeight: 'bold', color: '#1565c0', marginBottom: 2 },
  videoLink: { color: '#1565c0', fontSize: 12 },
  locationsBox: { marginTop: 12, backgroundColor: '#f1f8e9', borderRadius: 8, padding: 10 },
  locationItem: { fontSize: 13, color: '#333', marginBottom: 4 },
  top3Box: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  top3Title: { fontSize: 13, fontWeight: 'bold', color: '#777', marginBottom: 4 },
  top3Item: { color: '#999', fontSize: 12, marginBottom: 2 },
});
