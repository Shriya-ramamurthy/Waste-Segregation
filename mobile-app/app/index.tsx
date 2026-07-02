import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

type ClassificationResult = {
  success: boolean;
  detectedLabel?: string;
  itemName: string;
  wasteType: string;
  material: string;
  category: string;
  guidance: string[];
  videoUrl?: string;
  city?: string;
  rawLabels?: {
    description?: string;
    score?: number;
  }[];
  locations?: {
    name: string;
    cities: string[];
    phone?: string;
  }[];
};

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [city, setCity] = useState("Chennai");

  const uploadImageToBackend = async (imageUri: string) => {
    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "waste-image.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("city", city);

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/classify`, {
  method: "POST",
  body: formData,
});

      const rawText = await response.text();
      console.log("STATUS:", response.status);
      console.log("RAW RESPONSE:", rawText);

      if (!response.ok) {
        throw new Error(`Server error ${response.status}: ${rawText}`);
      }

      const data = JSON.parse(rawText);
      setResult(data);
    } catch (error: any) {
      console.log("UPLOAD ERROR:", error);
      Alert.alert("Upload failed", error.message || "Could not send image to backend.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow gallery access.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!picked.canceled) {
      const uri = picked.assets[0].uri;
      setSelectedImage(uri);
      uploadImageToBackend(uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }

    const captured = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!captured.canceled) {
      const uri = captured.assets[0].uri;
      setSelectedImage(uri);
      uploadImageToBackend(uri);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Waste Wise</Text>
      <Text style={styles.subtitle}>
        Identify waste and get the right disposal guidance.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan waste item</Text>
        <Text style={styles.cardText}>
          Take a photo or upload an image to begin classification.
        </Text>

        <Text style={styles.inputLabel}>Your city</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Enter city, e.g. Chennai"
          style={styles.input}
          autoCapitalize="words"
        />

        <Pressable style={styles.primaryButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.secondaryButtonText}>Upload Image</Text>
        </Pressable>
      </View>

      {selectedImage && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Selected image</Text>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        </View>
      )}

      {loading && (
        <View style={styles.resultCard}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Analyzing waste item...</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Classification Result</Text>
          <Text style={styles.resultItem}>Item: {result.itemName}</Text>
          <Text style={styles.resultItem}>
            Detected label: {result.detectedLabel || "Not available"}
          </Text>
          <Text style={styles.resultItem}>Waste type: {result.wasteType}</Text>
          <Text style={styles.resultItem}>Material: {result.material}</Text>
          <Text style={styles.resultMaterial}>Category: {result.category}</Text>

          <Text style={styles.sectionTitle}>Guidance</Text>
          {result.guidance?.map((step, index) => (
            <Text key={index} style={styles.guidanceText}>
              {index + 1}. {step}
            </Text>
          ))}

          {result.videoUrl ? (
            <>
              <Text style={styles.sectionTitle}>Video guide</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => WebBrowser.openBrowserAsync(result.videoUrl!)}
              >
                <Text style={styles.buttonText}>Watch recycling video</Text>
              </Pressable>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>
            Locations in {result.city || city}
          </Text>
          {result.locations && result.locations.length > 0 ? (
            result.locations.map((loc, index) => (
              <View key={index} style={styles.locationCard}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.locationCities}>
                  Cities: {loc.cities.join(", ")}
                </Text>
                {loc.phone ? (
                  <Text style={styles.locationPhone}>Phone: {loc.phone}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.guidanceText}>
              No city-specific locations found.
            </Text>
          )}

          {result.rawLabels && result.rawLabels.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Detected labels</Text>
              {result.rawLabels.map((label, index) => (
                <Text key={index} style={styles.guidanceText}>
                  {label.description} ({label.score?.toFixed(2)})
                </Text>
              ))}
            </>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F4F8F5",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1D3B2A",
    marginBottom: 8,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#4E6A59",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D3B2A",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: "#5E6E64",
    marginBottom: 20,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D3B2A",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C9D7CD",
    backgroundColor: "#F9FBF9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1D3B2A",
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D3B2A",
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    resizeMode: "cover",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4E6A59",
    textAlign: "center",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D3B2A",
    marginBottom: 12,
  },
  resultItem: {
    fontSize: 17,
    color: "#1D3B2A",
    marginBottom: 6,
  },
  resultMaterial: {
    fontSize: 16,
    color: "#4E6A59",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D3B2A",
    marginTop: 12,
    marginBottom: 8,
  },
  guidanceText: {
    fontSize: 15,
    color: "#4E6A59",
    marginBottom: 6,
    lineHeight: 22,
  },
  locationCard: {
    backgroundColor: "#F7FAF7",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E1ECE3",
  },
  locationName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D3B2A",
    marginBottom: 4,
  },
  locationCities: {
    fontSize: 14,
    color: "#4E6A59",
    marginBottom: 4,
  },
  locationPhone: {
    fontSize: 14,
    color: "#4E6A59",
  },
});