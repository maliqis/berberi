import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Modal,
  Animated,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import barberService from '../services/barberService';
import employeeService from '../services/employeeService';
import availabilityService from '../services/availabilityService';
import reservationService from '../services/reservationService';
import favoriteService from '../services/favoriteService';

// Helper function to format date as YYYY-MM-DD
const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate time slots from availability data
const generateTimeSlotsFromAvailability = (availability, employees, selectedBarberId) => {
  if (!availability || availability.length === 0) {
    return [];
  }

  // Filter by selected barber if specified
  let filteredAvailability = availability;
  if (selectedBarberId) {
    filteredAvailability = availability.filter(slot => slot.barberId === selectedBarberId);
  }

  // Extract unique times and sort
  const timeSlots = filteredAvailability
    .map(slot => slot.time)
    .filter((time, index, self) => self.indexOf(time) === index)
    .sort();

  return timeSlots;
};

const MyBarberScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const [shop, setShop] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null); // null = Auto Select
  const [showBarberDropdown, setShowBarberDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  // Load favorite shop and employees
  const loadShopData = async () => {
    try {
      setIsLoading(true);
      
      // Get favorite shop from API
      const favorites = await favoriteService.getFavorites();
      let shopId = null;
      
      if (favorites && favorites.length > 0) {
        shopId = favorites[0].shopId;
      } else {
        // Fallback to cached local storage
        const cachedShopId = await AsyncStorage.getItem('@berberi_selected_barber_id');
        if (cachedShopId) {
          shopId = cachedShopId;
        } else {
          Alert.alert(
            t('myBarber.noFavorite') || 'No Favorite Shop',
            t('myBarber.selectFavorite') || 'Please select a barbershop from the Home screen first.'
          );
          navigation.navigate('Home');
          return;
        }
      }

      // Load shop details
      const shopData = await barberService.getBarberById(shopId);
      setShop(shopData);

      // Load employees
      const employeesData = await employeeService.getEmployees(shopId);
      setEmployees(employeesData);

      // Load availability for selected date
      await loadAvailability(shopId, selectedDate, null);
    } catch (error) {
      console.error('Error loading shop data:', error);
      Alert.alert(
        t('myBarber.errorTitle') || 'Error',
        error.message || t('myBarber.loadError') || 'Failed to load shop data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load availability for a specific date
  const loadAvailability = async (shopId, date, barberId) => {
    try {
      setIsLoadingAvailability(true);
      const dateString = formatDateForAPI(date);
      const availabilityData = await availabilityService.getAvailability(shopId, dateString, barberId);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailability([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Load shop data on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadShopData();
    }, [])
  );

  // Reload availability when date or selected barber changes
  useEffect(() => {
    if (shop?.id) {
      loadAvailability(shop.id, selectedDate, selectedBarber);
    }
  }, [selectedDate, selectedBarber, shop]);
  
  // Load stored barber employee ID on mount (UX preference only)
  useEffect(() => {
    const loadStoredBarberEmployee = async () => {
      try {
        const storedEmployeeId = await AsyncStorage.getItem('@berberi_selected_barber_employee_id');
        if (storedEmployeeId && employees.length > 0) {
          const employeeExists = employees.find(e => e.id === storedEmployeeId);
          if (employeeExists) {
            setSelectedBarber(storedEmployeeId);
          }
        }
      } catch (error) {
        console.error('Error loading stored barber employee:', error);
      }
    };
    
    if (employees.length > 0) {
      loadStoredBarberEmployee();
    }
  }, [employees]);
  
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
  
  const currentBarber = selectedBarber ? employees.find(e => e.id === selectedBarber) : null;
  const timeSlots = generateTimeSlotsFromAvailability(availability, employees, selectedBarber);

  const isSlotBooked = (time) => {
    if (!availability || availability.length === 0) {
      return true; // No availability data means slot is not available
    }

    // Find the slot in availability data
    const slot = availability.find(s => s.time === time);
    
    if (!slot) {
      return true; // Slot not in availability means it's not available
    }

    // If specific barber is selected, check if this slot is for that barber
    if (selectedBarber) {
      return slot.barberId !== selectedBarber || !slot.isAvailable;
    }

    // Auto Select - slot is available if at least one barber has it available
    return !slot.isAvailable;
  };

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setSelectedTime(null); // Reset time when date changes
      }
    } else {
      // iOS
      if (date) {
        setSelectedDate(date);
        setSelectedTime(null); // Reset time when date changes
      }
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('myBarber.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('myBarber.tomorrow');
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
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
        {isLoading ? (
          <View style={styles.__loading_container}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.__loading_text}>
              {t('myBarber.loading') || 'Loading shop information...'}
            </Text>
          </View>
        ) : !shop ? (
          <View style={styles.__error_container}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.__error_text}>
              {t('myBarber.noShop') || 'No shop selected. Please select a barbershop from the Home screen.'}
            </Text>
            <TouchableOpacity
              style={styles.__retry_button}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.__retry_button_text}>
                {t('myBarber.goToHome') || 'Go to Home'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
        <View style={styles.__barber_info_card_wrapper}>
          <View style={styles.__barber_info_card}>
            <View style={styles.__barber_header}>
              <Ionicons name="heart" size={20} color="#FFD700" />
              <View style={styles.__barber_name_container}>
                <Text style={styles.__barber_name}>{shop?.name || t('myBarber.loading') || 'Loading...'}</Text>
              </View>
              {currentBarber ? (
                <Text style={styles.__barber_hours_inline}>
                  {currentBarber.shiftStart} - {currentBarber.shiftEnd}
                </Text>
              ) : (
                <Text style={styles.__barber_hours_inline}>
                  {shop ? `${shop.shiftStart} - ${shop.shiftEnd}` : ''}
                </Text>
              )}
            </View>
            {currentBarber && (
              <Text style={styles.__barber_hours}>
                {currentBarber.name}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.__content}
          contentContainerStyle={styles.__content_container}
          showsVerticalScrollIndicator={false}
        >
        {/* Barber Selection Section */}
        <View style={styles.__section}>
          <Text style={styles.__section_title}>{t('myBarber.selectBarber')}</Text>
          <TouchableOpacity
            style={styles.__barber_dropdown_button}
            onPress={() => setShowBarberDropdown(true)}
            activeOpacity={0.7}
          >
            {selectedBarber ? (
              <>
                {currentBarber?.avatarUrl || currentBarber?.image ? (
                  <Image
                    source={{ uri: currentBarber.avatarUrl || currentBarber.image }}
                    style={styles.__barber_dropdown_image}
                  />
                ) : (
                  <View style={[styles.__barber_dropdown_image, styles.__barber_dropdown_image_placeholder]}>
                    <Ionicons name="person" size={20} color="#FFD700" />
                  </View>
                )}
                <Text style={styles.__barber_dropdown_text}>
                  {currentBarber?.name || ''}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.__auto_select_icon}>
                  <Ionicons name="shuffle" size={20} color="#FFD700" />
                </View>
                <Text style={styles.__barber_dropdown_text}>{t('myBarber.autoSelect')}</Text>
              </>
            )}
            <Ionicons name="chevron-down" size={20} color="#FFD700" />
          </TouchableOpacity>

          <Modal
            visible={showBarberDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBarberDropdown(false)}
          >
            <TouchableOpacity
              style={styles.__modal_overlay}
              activeOpacity={1}
              onPress={() => setShowBarberDropdown(false)}
            >
              <View style={styles.__dropdown_container}>
                <TouchableOpacity
                  style={[
                    styles.__dropdown_item,
                    !selectedBarber && styles.__dropdown_item_selected,
                  ]}
                  onPress={async () => {
                    setSelectedBarber(null);
                    setShowBarberDropdown(false);
                    setSelectedTime(null);
                    // Save Auto Select to storage (remove employee selection)
                    try {
                      await AsyncStorage.removeItem('@berberi_selected_barber_employee_id');
                    } catch (error) {
                      console.error('Error saving barber employee selection:', error);
                    }
                  }}
                >
                  <View style={styles.__auto_select_icon}>
                    <Ionicons name="shuffle" size={20} color="#FFD700" />
                  </View>
                  <Text
                    style={[
                      styles.__dropdown_item_text,
                      !selectedBarber && styles.__dropdown_item_text_selected,
                    ]}
                  >
                    {t('myBarber.autoSelect')}
                  </Text>
                  {!selectedBarber && (
                    <Ionicons name="checkmark" size={20} color="#FFD700" />
                  )}
                </TouchableOpacity>

                {employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.__dropdown_item,
                      selectedBarber === employee.id &&
                        styles.__dropdown_item_selected,
                    ]}
                    onPress={async () => {
                      setSelectedBarber(employee.id);
                      setShowBarberDropdown(false);
                      setSelectedTime(null);
                      // Save selected employee to storage (UX preference only)
                      try {
                        await AsyncStorage.setItem('@berberi_selected_barber_employee_id', employee.id);
                      } catch (error) {
                        console.error('Error saving barber employee selection:', error);
                      }
                    }}
                  >
                    {employee.avatarUrl || employee.image ? (
                      <Image
                        source={{ uri: employee.avatarUrl || employee.image }}
                        style={styles.__dropdown_item_image}
                      />
                    ) : (
                      <View style={[styles.__dropdown_item_image, styles.__dropdown_item_image_placeholder]}>
                        <Ionicons name="person" size={20} color="#FFD700" />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.__dropdown_item_text,
                        selectedBarber === employee.id &&
                          styles.__dropdown_item_text_selected,
                      ]}
                    >
                      {employee.name}
                    </Text>
                    {selectedBarber === employee.id && (
                      <Ionicons name="checkmark" size={20} color="#FFD700" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        {/* Date Picker Section */}
        <View style={styles.__section}>
          <Text style={styles.__section_title}>{t('myBarber.selectDate')}</Text>
          <TouchableOpacity
            style={styles.__date_picker_button}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFD700" />
            <Text style={styles.__date_picker_text}>
              {formatDate(selectedDate)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFD700" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Time Picker Section */}
        <View style={styles.__section}>
          <Text style={styles.__section_title}>{t('myBarber.selectTime')}</Text>
          {isLoadingAvailability ? (
            <View style={styles.__loading_time_slots}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.__loading_time_slots_text}>
                {t('myBarber.loadingAvailability') || 'Loading availability...'}
              </Text>
            </View>
          ) : timeSlots.length === 0 ? (
            <View style={styles.__empty_time_slots}>
              <Text style={styles.__empty_time_slots_text}>
                {t('myBarber.noAvailableSlots') || 'No available time slots for this date'}
              </Text>
            </View>
          ) : (
            <View style={styles.__time_slots_container}>
              {timeSlots.map((time) => {
                const isBooked = isSlotBooked(time);
                const isSelected = selectedTime === time;

                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.__time_slot,
                      isSelected && styles.__time_slot_selected,
                      isBooked && styles.__time_slot_disabled,
                    ]}
                    onPress={() => {
                      if (!isBooked) {
                        // Toggle: if already selected, unselect; otherwise select
                        setSelectedTime(isSelected ? null : time);
                      }
                    }}
                    disabled={isBooked}
                    activeOpacity={0.7}
                  >
                    {isBooked && (
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color="rgba(255, 215, 0, 0.6)"
                        style={styles.__lock_icon}
                      />
                    )}
                    <Text
                      style={[
                        styles.__time_slot_text,
                        isSelected && styles.__time_slot_text_selected,
                        isBooked && styles.__time_slot_text_disabled,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Customer Information Section */}
        {selectedTime && (
          <View style={styles.__section}>
            <Text style={styles.__section_title}>{t('myBarber.customerInfo')}</Text>
            
            <View style={styles.__input_row}>
              <View style={styles.__input_container_half}>
                <Text style={styles.__input_label}>{t('myBarber.firstName')}</Text>
                <TextInput
                  style={styles.__input}
                  placeholder={t('myBarber.firstNamePlaceholder')}
                  placeholderTextColor="rgba(255, 215, 0, 0.5)"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              
              <View style={styles.__input_container_half}>
                <Text style={styles.__input_label}>{t('myBarber.lastName')}</Text>
                <TextInput
                  style={styles.__input}
                  placeholder={t('myBarber.lastNamePlaceholder')}
                  placeholderTextColor="rgba(255, 215, 0, 0.5)"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
            
            <View style={styles.__input_container}>
              <Text style={styles.__input_label}>{t('myBarber.comment')} ({t('myBarber.optional')})</Text>
              <TextInput
                style={[styles.__input, styles.__input_multiline]}
                placeholder={t('myBarber.commentPlaceholder')}
                placeholderTextColor="rgba(255, 215, 0, 0.5)"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Book Button at Bottom */}
      {selectedTime && (
        <View style={styles.__fixed_button_container}>
          <TouchableOpacity
            style={styles.__book_button}
            activeOpacity={0.8}
            onPress={async () => {
              if (!shop || !selectedTime) {
                return;
              }

              try {
                // Create reservation via API
                const reservationData = {
                  shopId: shop.id,
                  date: selectedDate.toISOString(),
                  time: selectedTime,
                  firstName: firstName.trim() || user?.firstName || '',
                  lastName: lastName.trim() || user?.lastName || '',
                  comment: comment.trim() || '',
                  clientNumber: user?.phoneNumber || '',
                };

                // Include barberId only if specific barber is selected (omit for auto-assign)
                if (selectedBarber) {
                  reservationData.barberId = selectedBarber;
                }

                await reservationService.createReservation(reservationData);

                // Show success animation
                setShowSuccessAnimation(true);
                Animated.parallel([
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                  }),
                  Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start();

                // Reload availability to reflect the new booking
                if (shop?.id) {
                  await loadAvailability(shop.id, selectedDate, selectedBarber);
                }

                // After animation, navigate to reservations
                setTimeout(() => {
                  setShowSuccessAnimation(false);
                  scaleAnim.setValue(0);
                  opacityAnim.setValue(0);
                  navigation.navigate('MyReservations');
                  // Reset selection
                  setSelectedTime(null);
                  setFirstName('');
                  setLastName('');
                  setComment('');
                }, 2000);
              } catch (error) {
                console.error('Error creating reservation:', error);
                Alert.alert(
                  t('myBarber.errorTitle') || 'Booking Failed',
                  error.message || t('myBarber.bookingError') || 'Failed to create reservation. Please try again.'
                );
              }
            }}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.__book_button_gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.__book_button_text}>{t('myBarber.bookAppointment')}</Text>
            </LinearGradient>
            <View style={styles.__button_shadow} />
          </TouchableOpacity>
        </View>
      )}

      {/* Success Animation Modal */}
      {showSuccessAnimation && (
        <Modal
          transparent={true}
          visible={showSuccessAnimation}
          animationType="none"
          onRequestClose={() => {}}
        >
          <View style={styles.__success_modal_overlay}>
            <Animated.View
              style={[
                styles.__success_animation_container,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={styles.__success_checkmark_container}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              </View>
              <Text style={styles.__success_text}>{t('reservations.success')}</Text>
              <Text style={styles.__success_subtext}>{t('reservations.redirecting')}</Text>
            </Animated.View>
          </View>
        </Modal>
      )}
          </>
        )}
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
  __header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  __logo_container: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  __logo_gradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __logo_glow: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 52.5,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    zIndex: -1,
  },
  __app_title: {
    fontSize: 48,
    fontFamily: 'GreatVibes_400Regular',
    color: '#FFD700',
    marginBottom: 20,
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  __barber_info_card_wrapper: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  __barber_info_card: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 0,
    padding: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    width: '100%',
  },
  __barber_header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  __barber_name_container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  __barber_name: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  __barber_hours_inline: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  __barber_hours: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  __body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  __content: {
    flex: 1,
    zIndex: 1,
  },
          __content_container: {
            paddingBottom: 100, // Extra padding to account for fixed button
          },
  __section: {
    marginBottom: 24,
  },
  __section_title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  __input_row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  __input_container: {
    marginBottom: 12,
  },
  __input_container_half: {
    flex: 1,
    marginBottom: 12,
  },
  __input_label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginBottom: 6,
  },
  __input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  __input_multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  __date_picker_button: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __date_picker_text: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  __date_picker: {
    marginTop: 12,
  },
  __barber_dropdown_button: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __barber_dropdown_image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  __barber_dropdown_text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  __auto_select_icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  __modal_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  __dropdown_container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __dropdown_item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  __dropdown_item_selected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  __dropdown_item_image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  __dropdown_item_text: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  __dropdown_item_text_selected: {
    color: '#FFD700',
  },
  __time_slots_container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  __time_slot: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  __time_slot_selected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  __time_slot_disabled: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderColor: 'rgba(255, 215, 0, 0.1)',
    opacity: 0.6,
  },
  __time_slot_text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  __time_slot_text_selected: {
    color: '#FFD700',
  },
  __time_slot_text_disabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  __lock_icon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  __loading_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingVertical: 60,
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
  __loading_time_slots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  __loading_time_slots_text: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  __empty_time_slots: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  __empty_time_slots_text: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  __dropdown_item_image_placeholder: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __barber_dropdown_image_placeholder: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __fixed_button_container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  __book_button: {
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  __book_button_gradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  __button_shadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 30,
    top: 4,
    zIndex: 0,
  },
  __book_button_text: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    letterSpacing: 1,
  },
  __success_modal_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  __success_animation_container: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
    maxWidth: 400,
  },
  __success_checkmark_container: {
    marginBottom: 20,
  },
  __success_text: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#10B981',
    marginBottom: 8,
  },
  __success_subtext: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MyBarberScreen;

