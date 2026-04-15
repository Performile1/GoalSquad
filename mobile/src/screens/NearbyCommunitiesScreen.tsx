import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

interface Community {
  id: string;
  name: string;
  communityType: string;
  city: string;
  country: string;
  totalMembers: number;
  distance: number; // km
  latitude: number;
  longitude: number;
}

export default function NearbyCommunitiesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Platsbehörighet krävs',
          'För att hitta lag i närheten behöver vi din plats.'
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      fetchNearbyCommunities(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error) {
      console.error('Location error:', error);
      setLoading(false);
    }
  };

  const fetchNearbyCommunities = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://goalsquad.shop/api/communities/nearby?lat=${lat}&lng=${lng}&radius=50`
      );
      const data = await response.json();
      setCommunities(data.communities || []);
    } catch (error) {
      console.error('Failed to fetch nearby communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCommunity = ({ item }: { item: Community }) => (
    <TouchableOpacity style={styles.communityItem}>
      <View style={styles.communityIcon}>
        <Text style={styles.communityEmoji}>
          {getCommunityEmoji(item.communityType)}
        </Text>
      </View>
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityLocation}>
          {item.city}, {item.country}
        </Text>
        <Text style={styles.communityMembers}>
          {item.totalMembers} medlemmar
        </Text>
      </View>
      <View style={styles.distanceContainer}>
        <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        <Text style={styles.distanceLabel}>bort</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>📍</Text>
        <Text style={styles.loadingText}>Hämtar din plats...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>🗺️</Text>
        <Text style={styles.errorText}>
          Kunde inte hämta din plats
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toggle Map/List */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(false)}
        >
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(true)}
        >
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>
            Karta
          </Text>
        </TouchableOpacity>
      </View>

      {showMap ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          {/* User location */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Din plats"
            pinColor="blue"
          />

          {/* Communities */}
          {communities.map((community) => (
            <Marker
              key={community.id}
              coordinate={{
                latitude: community.latitude,
                longitude: community.longitude,
              }}
              title={community.name}
              description={`${community.totalMembers} medlemmar`}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={communities}
          renderItem={renderCommunity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏘️</Text>
              <Text style={styles.emptyText}>
                Inga lag hittades i närheten
              </Text>
              <Text style={styles.emptySubtext}>
                Försök öka sökradien eller skapa ett eget lag!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function getCommunityEmoji(type: string): string {
  const emojis: Record<string, string> = {
    sports_team: '⚽',
    school_class: '🎓',
    youth_club: '🎪',
    scout_troop: '🏕️',
    music_band: '🎵',
    charity_org: '❤️',
  };
  return emojis[type] || '👥';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: 'white',
  },
  map: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityEmoji: {
    fontSize: 24,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  communityLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  communityMembers: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
