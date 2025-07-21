import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

export default function MapLocationPicker({
  visible,
  initialCoords,
  onConfirm,
  onCancel,
  title = 'Select Location',
}) {
  const [region, setRegion] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      if (initialCoords) {
        setRegion({
          ...initialCoords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSelectedCoords(initialCoords);
        reverseGeocode(initialCoords);
        setLoading(false);
      } else {
        (async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLoading(false);
            return;
          }
          let loc = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
          setSelectedCoords(coords);
          reverseGeocode(coords);
          setLoading(false);
        })();
      }
    }
  }, [visible]);

  const reverseGeocode = async (coords) => {
    setAddress('');
    try {
      const geocode = await Location.reverseGeocodeAsync(coords);
      if (geocode && geocode.length > 0) {
        setAddress(`${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}`);
      }
    } catch {
      setAddress('');
    }
  };

  const handleRegionChange = (reg) => {
    setRegion(reg);
    setSelectedCoords({ latitude: reg.latitude, longitude: reg.longitude });
  };

  const handleRegionChangeComplete = (reg) => {
    setSelectedCoords({ latitude: reg.latitude, longitude: reg.longitude });
    reverseGeocode({ latitude: reg.latitude, longitude: reg.longitude });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.mapContainer}>
            {region ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation={true}
              >
                {selectedCoords && (
                  <Marker coordinate={selectedCoords} pinColor="#007AFF" />
                )}
              </MapView>
            ) : (
              <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
            )}
            {/* Center pin overlay */}
            <View pointerEvents="none" style={styles.centerPinContainer}>
              <MaterialIcons name="place" size={40} color="#007AFF" style={{ alignSelf: 'center' }} />
            </View>
          </View>
          <Text style={styles.address}>{address || 'Fetching address...'}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedCoords && { backgroundColor: '#ccc' }]}
              onPress={() => selectedCoords && onConfirm && onConfirm({ coords: selectedCoords, address })}
              disabled={!selectedCoords}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.95,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -20,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  address: {
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  confirmBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 10,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 