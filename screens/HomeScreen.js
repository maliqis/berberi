import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const { width } = Dimensions.get('window');

// Mock barber data (temporary - will be replaced with API)
const mockBarbers = [
  {
    id: '1',
    name: 'Classic Cuts',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
    isOpen: true,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    nextAvailableSlot: 0, // 0 = today, 1 = tomorrow, 2+ = in X days
  },
  {
    id: '2',
    name: 'Elite Barbershop',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
    isOpen: true,
    shiftStart: '08:00',
    shiftEnd: '20:00',
    nextAvailableSlot: 1, // tomorrow
  },
  {
    id: '3',
    name: 'Modern Style',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    isOpen: false,
    shiftStart: '10:00',
    shiftEnd: '19:00',
    nextAvailableSlot: 3, // in 3 days
  },
  {
    id: '4',
    name: 'The Gentleman\'s Cut',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a72937?w=400',
    isOpen: true,
    shiftStart: '07:00',
    shiftEnd: '17:00',
    nextAvailableSlot: 0, // today
  },
  {
    id: '5',
    name: 'Urban Barbers',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400',
    isOpen: false,
    shiftStart: '09:30',
    shiftEnd: '18:30',
    nextAvailableSlot: 2, // in 2 days
  },
];

const getFreeSlotsLabel = (days, t) => {
  if (days === 0) return t('home.freeSlotsToday');
  if (days === 1) return t('home.freeSlotsTomorrow');
  return t('home.freeSlotsInDays', { days });
};

const BarberCard = ({ barber, t, onOpenPress }) => {
  const [imageError, setImageError] = useState(false);
  const statusColor = barber.isOpen ? '#10B981' : '#EF4444';
  const statusText = barber.isOpen ? t('home.open') : t('home.closed');
  const hasImage = barber.image && !imageError;

  return (
    <View style={styles.__barber_card}>
      {/* Decorative Branch Border - Top Left */}
      <View style={styles.__decorative_branch_container}>
        {/* Main branch stem */}
        <View style={styles.__branch_stem} />
        {/* Branch offshoot 1 */}
        <View style={styles.__branch_offshoot_1} />
        <View style={styles.__branch_offshoot_1_extension} />
        {/* Branch offshoot 2 */}
        <View style={styles.__branch_offshoot_2} />
        <View style={styles.__branch_offshoot_2_extension} />
        {/* Branch offshoot 3 */}
        <View style={styles.__branch_offshoot_3} />
        {/* Small twigs */}
        <View style={styles.__branch_twig_1} />
        <View style={styles.__branch_twig_2} />
        <View style={styles.__branch_twig_3} />
        {/* Leaves */}
        <View style={styles.__branch_leaf_1} />
        <View style={styles.__branch_leaf_2} />
        <View style={styles.__branch_leaf_3} />
        <View style={styles.__branch_leaf_4} />
      </View>

      {/* Card Content - Horizontal Layout */}
      <View style={styles.__card_content}>
        {/* Image Thumbnail */}
        <View style={styles.__barber_image_container}>
          {hasImage ? (
            <Image
              source={{ uri: barber.image }}
              style={styles.__barber_image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.__image_placeholder}>
              <LinearGradient
                colors={['rgba(26, 26, 46, 0.95)', 'rgba(22, 33, 62, 0.95)', 'rgba(15, 52, 96, 0.95)']}
                style={styles.__placeholder_gradient}
              >
                {/* Decorative frame */}
                <View style={styles.__placeholder_frame} />
                <View style={styles.__placeholder_frame_inner} />
                
                {/* Scissors icon */}
                <View style={styles.__placeholder_scissors_container}>
                  <View style={styles.__placeholder_scissors_left}>
                    <View style={styles.__placeholder_scissors_blade} />
                    <View style={styles.__placeholder_scissors_handle} />
                  </View>
                  <View style={styles.__placeholder_scissors_right}>
                    <View style={styles.__placeholder_scissors_blade} />
                    <View style={styles.__placeholder_scissors_handle} />
                  </View>
                  <View style={styles.__placeholder_scissors_pivot} />
                </View>

                {/* Decorative elements */}
                <View style={styles.__placeholder_ornament_1} />
                <View style={styles.__placeholder_ornament_2} />
                <View style={styles.__placeholder_ornament_3} />
                <View style={styles.__placeholder_ornament_4} />
                
                {/* Text */}
                <Text style={styles.__placeholder_text}>BERBERI</Text>
              </LinearGradient>
            </View>
          )}
          <View style={styles.__image_overlay} />
        </View>

        {/* Info Section */}
        <View style={styles.__barber_info}>
          <Text style={styles.__barber_name} numberOfLines={2} ellipsizeMode="tail">
            {barber.name}
          </Text>

          <View style={styles.__info_row}>
            <Ionicons name="calendar-outline" size={16} color="#FFD700" />
            <Text style={styles.__free_slots_label} numberOfLines={2} ellipsizeMode="tail">
              {getFreeSlotsLabel(barber.nextAvailableSlot, t)}
            </Text>
          </View>

          <View style={styles.__info_row}>
            <Ionicons name="time-outline" size={16} color="#FFD700" />
            <Text style={styles.__shift_time}>
              {barber.shiftStart} - {barber.shiftEnd}
            </Text>
            <Text style={styles.__status_separator}> | </Text>
            <Text style={[styles.__status_text_inline, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Open Button - Full Height on Right */}
        <TouchableOpacity
          style={styles.__open_button}
          onPress={() => onOpenPress(barber.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.__open_button_gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="arrow-forward" size={20} color="#1a1a2e" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const flatListRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBarbers, setFilteredBarbers] = useState(mockBarbers);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search - wait 1 second after user stops typing
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setIsSearching(true);
    }
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredBarbers(mockBarbers);
      } else {
        const filtered = mockBarbers.filter(barber =>
          barber.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredBarbers(filtered);
      }
      setIsSearching(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  const handleLogoPress = () => {
    // Replace with Landing screen in parent stack navigator
    const parent = navigation.getParent();
    if (parent) {
      parent.replace('Landing');
    } else {
      navigation.replace('Landing');
    }
  };

  const handleLogout = () => {
    logout();
    // Navigate to Landing screen after logout
    const parent = navigation.getParent();
    if (parent) {
      parent.replace('Landing');
    } else {
      navigation.replace('Landing');
    }
  };

  const handleOpenBarber = async (barberId) => {
    try {
      // Save barber ID to local storage
      await AsyncStorage.setItem('@berberi_selected_barber_id', barberId);
      // Navigate to MyBarber tab
      navigation.navigate('MyBarber');
    } catch (error) {
      console.error('Error saving barber ID:', error);
    }
  };
  
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.__container}
    >
      <StatusBar style="light" />
      
      {/* Decorative Elements */}
      <View style={styles.__decorative_circle_1} />
      <View style={styles.__decorative_circle_2} />
      
      {/* NavBar */}
      <NavBar onLogoPress={handleLogoPress} onLogout={handleLogout} />

      {/* Body */}
      <View style={[styles.__body, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <View style={styles.__header}>
          <View style={styles.__header_title_container}>
            <LinearGradient
              colors={['rgba(26, 26, 46, 1)', 'rgba(26, 26, 46, 0.9)', 'rgba(26, 26, 46, 0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.__header_title_gradient}
            >
              <View style={styles.__header_input_container}>
                <Ionicons name="search" size={16} color="#FFD700" style={styles.__header_search_icon} />
                <TextInput
                  style={styles.__header_title}
                  placeholder={t('home.searchPlaceholder')}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {isSearching && (
                  <ActivityIndicator
                    size="small"
                    color="#10B981"
                    style={styles.__header_loading_indicator}
                  />
                )}
              </View>
            </LinearGradient>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={filteredBarbers}
          renderItem={({ item }) => <BarberCard barber={item} t={t} onOpenPress={handleOpenBarber} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.__list_container}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  __container: {
    flex: 1,
    position: 'relative',
  },
  __decorative_circle_1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    top: -80,
    right: -80,
    zIndex: 0,
  },
  __decorative_circle_2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    bottom: 100,
    left: -40,
    zIndex: 0,
  },
  __body: {
    flex: 1,
    paddingHorizontal: 20,
    position: 'relative',
  },
  __header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  __header_title_container: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    marginBottom: 12,
    width: '100%',
    backgroundColor: 'transparent',
    elevation: 8,
  },
  __header_title_gradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  __header_input_container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  __header_search_icon: {
    marginRight: 8,
  },
  __header_title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    padding: 0,
  },
  __header_loading_indicator: {
    marginLeft: 8,
  },
  __header_subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    paddingLeft: 18,
  },
  __list_container: {
    paddingBottom: 30,
    paddingTop: 70,
    zIndex: 0,
  },
  __loading_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  __loading_text: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  __error_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  __error_text: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  __retry_button: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  __retry_button_text: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __empty_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  __empty_text: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  __barber_card: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    position: 'relative',
  },
  __card_content: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 120,
    flex: 1,
  },
  __decorative_branch_container: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 140,
    height: 140,
    zIndex: 10,
    overflow: 'visible',
  },
  // Main branch stem - curves from top-left corner
  __branch_stem: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
    borderRadius: 2,
    transform: [{ rotate: '35deg' }],
  },
  // First offshoot branch
  __branch_offshoot_1: {
    position: 'absolute',
    top: 20,
    left: 15,
    width: 3,
    height: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.65)',
    borderRadius: 1.5,
    transform: [{ rotate: '-20deg' }],
  },
  __branch_offshoot_1_extension: {
    position: 'absolute',
    top: 35,
    left: 28,
    width: 2.5,
    height: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    borderRadius: 1.25,
    transform: [{ rotate: '15deg' }],
  },
  // Second offshoot branch
  __branch_offshoot_2: {
    position: 'absolute',
    top: 12,
    left: 8,
    width: 3,
    height: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.65)',
    borderRadius: 1.5,
    transform: [{ rotate: '50deg' }],
  },
  __branch_offshoot_2_extension: {
    position: 'absolute',
    top: 25,
    left: 18,
    width: 2.5,
    height: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    borderRadius: 1.25,
    transform: [{ rotate: '-10deg' }],
  },
  // Third offshoot branch
  __branch_offshoot_3: {
    position: 'absolute',
    top: 30,
    left: 5,
    width: 2.5,
    height: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    borderRadius: 1.25,
    transform: [{ rotate: '70deg' }],
  },
  // Small twigs
  __branch_twig_1: {
    position: 'absolute',
    top: 15,
    left: 22,
    width: 2,
    height: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.55)',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  __branch_twig_2: {
    position: 'absolute',
    top: 28,
    left: 32,
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 1,
    transform: [{ rotate: '30deg' }],
  },
  __branch_twig_3: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 1.5,
    height: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 0.75,
    transform: [{ rotate: '60deg' }],
  },
  // Leaves - more organic shapes
  __branch_leaf_1: {
    position: 'absolute',
    top: 18,
    left: 30,
    width: 14,
    height: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.7)',
    borderRadius: 10,
    transform: [{ rotate: '-25deg' }],
  },
  __branch_leaf_2: {
    position: 'absolute',
    top: 32,
    left: 38,
    width: 12,
    height: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.65)',
    borderRadius: 8,
    transform: [{ rotate: '40deg' }],
  },
  __branch_leaf_3: {
    position: 'absolute',
    top: 10,
    left: 18,
    width: 10,
    height: 7,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.6)',
    borderRadius: 7,
    transform: [{ rotate: '55deg' }],
  },
  __branch_leaf_4: {
    position: 'absolute',
    top: 25,
    left: 25,
    width: 11,
    height: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.65)',
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },
  __barber_image_container: {
    width: 100,
    alignSelf: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    flexShrink: 0,
  },
  __barber_image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  __image_placeholder: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  __placeholder_gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  __placeholder_frame: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  __placeholder_frame_inner: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 6,
  },
  __placeholder_scissors_container: {
    width: 50,
    height: 50,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  __placeholder_scissors_left: {
    position: 'absolute',
    width: 25,
    height: 25,
    left: 0,
    top: 12,
    transform: [{ rotate: '-15deg' }],
  },
  __placeholder_scissors_right: {
    position: 'absolute',
    width: 25,
    height: 25,
    right: 0,
    top: 12,
    transform: [{ rotate: '15deg' }],
  },
  __placeholder_scissors_blade: {
    width: 15,
    height: 2,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  __placeholder_scissors_handle: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  __placeholder_scissors_pivot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    top: 12,
    left: 22,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  __placeholder_ornament_1: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 6,
    transform: [{ rotate: '45deg' }],
  },
  __placeholder_ornament_2: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 5,
    transform: [{ rotate: '-45deg' }],
  },
  __placeholder_ornament_3: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 4,
  },
  __placeholder_ornament_4: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    width: 9,
    height: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 4.5,
  },
  __placeholder_text: {
    fontSize: 12,
    fontFamily: 'GreatVibes_400Regular',
    color: '#FFD700',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  __image_overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.3)',
  },
  __status_badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
    maxWidth: '90%',
  },
  __status_dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    marginRight: 3,
  },
  __status_text: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  __barber_info: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    minHeight: 120,
    minWidth: 0,
    flexShrink: 1,
  },
  __barber_name: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    flexShrink: 1,
  },
  __info_row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  __free_slots_label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  __shift_time: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },
  __status_separator: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  __status_text_inline: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  __open_button: {
    width: 50,
    alignSelf: 'stretch',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    flexShrink: 0,
  },
  __open_button_gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;

