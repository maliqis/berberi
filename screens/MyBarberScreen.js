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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

// Mock data for favorite barber shop
const myBarberShop = {
  id: '1',
  name: 'Classic Cuts',
  image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
};

// Mock data for barbers (employees) in the shop
const barbers = [
  {
    id: 'barber1',
    name: 'John Smith',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    slotLengthMinutes: 60, // Appointment duration in minutes
  },
  {
    id: 'barber2',
    name: 'Mike Johnson',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    shiftStart: '10:00',
    shiftEnd: '18:00',
    slotLengthMinutes: 30, // Appointment duration in minutes
  },
];

// Mock booked time slots per barber (these will be disabled)
const bookedSlots = {
  barber1: [
    { date: new Date().toDateString(), time: '10:00' },
    { date: new Date().toDateString(), time: '14:00' },
    { date: new Date(Date.now() + 86400000).toDateString(), time: '11:00' },
  ],
  barber2: [
    { date: new Date().toDateString(), time: '12:00' },
    { date: new Date().toDateString(), time: '16:00' },
    { date: new Date(Date.now() + 86400000).toDateString(), time: '15:00' },
  ],
};

// Generate time slots based on barber's shift and slot length
const generateTimeSlots = (barber) => {
  if (!barber) {
    // Auto Select - generate all possible slots from all barbers
    const allSlots = new Set();
    barbers.forEach(b => {
      const slots = generateTimeSlotsForBarber(b);
      slots.forEach(slot => allSlots.add(slot));
    });
    return Array.from(allSlots).sort();
  }
  
  return generateTimeSlotsForBarber(barber);
};

// Helper function to generate slots for a specific barber
const generateTimeSlotsForBarber = (barber) => {
  const slots = [];
  const startHour = parseInt(barber.shiftStart.split(':')[0]);
  const startMinute = parseInt(barber.shiftStart.split(':')[1]) || 0;
  const endHour = parseInt(barber.shiftEnd.split(':')[0]);
  const endMinute = parseInt(barber.shiftEnd.split(':')[1]) || 0;
  const slotLengthMinutes = barber.slotLengthMinutes || 60;
  
  // Convert to minutes for easier calculation
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  // Generate slots: start from shift start, increment by slot length
  // Last slot must end before or at shift end
  let currentMinutes = startTotalMinutes;
  
  while (currentMinutes + slotLengthMinutes <= endTotalMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(time);
    currentMinutes += slotLengthMinutes;
  }
  
  return slots;
};

const MyBarberScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
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
  
  // Load stored barber employee ID on mount
  useEffect(() => {
    const loadStoredBarberEmployee = async () => {
      try {
        const storedEmployeeId = await AsyncStorage.getItem('@berberi_selected_barber_employee_id');
        if (storedEmployeeId) {
          // Check if the employee ID exists in the barbers array
          const employeeExists = barbers.find(b => b.id === storedEmployeeId);
          if (employeeExists) {
            setSelectedBarber(storedEmployeeId);
          } else {
            // If stored employee doesn't exist, clear it and default to Auto Select
            await AsyncStorage.removeItem('@berberi_selected_barber_employee_id');
          }
        }
        // If no stored employee, selectedBarber remains null (Auto Select)
      } catch (error) {
        console.error('Error loading stored barber employee:', error);
      }
    };
    
    loadStoredBarberEmployee();
  }, []);
  
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
  
  const currentBarber = selectedBarber ? barbers.find(b => b.id === selectedBarber) : null;
  const timeSlots = generateTimeSlots(currentBarber);

  const isSlotBooked = (time) => {
    if (!selectedBarber) {
      // Auto Select - slot is available if at least one barber has it free
      // So it's booked only if ALL barbers have it booked
      const dateString = selectedDate.toDateString();
      
      // Check if the time is within at least one barber's shift
      // and if there's enough time for an appointment
      const isWithinAnyShift = barbers.some(barber => {
        const startHour = parseInt(barber.shiftStart.split(':')[0]);
        const startMinute = parseInt(barber.shiftStart.split(':')[1]) || 0;
        const endHour = parseInt(barber.shiftEnd.split(':')[0]);
        const endMinute = parseInt(barber.shiftEnd.split(':')[1]) || 0;
        const slotLengthMinutes = barber.slotLengthMinutes || 60;
        
        const timeHour = parseInt(time.split(':')[0]);
        const timeMinute = parseInt(time.split(':')[1]) || 0;
        
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        const timeTotalMinutes = timeHour * 60 + timeMinute;
        
        // Check if time is within shift and there's enough time for the appointment
        return timeTotalMinutes >= startTotalMinutes && 
               timeTotalMinutes + slotLengthMinutes <= endTotalMinutes;
      });
      
      if (!isWithinAnyShift) {
        return true; // Time is outside all barbers' shifts
      }
      
      // Check if ALL barbers have this slot booked
      const allBarbersBooked = barbers.every(barber => {
        const barberBookedSlots = bookedSlots[barber.id] || [];
        return barberBookedSlots.some(
          (slot) => slot.date === dateString && slot.time === time
        );
      });
      
      return allBarbersBooked;
    }
    
    // Specific barber selected - check if this barber has it booked
    const barberBookedSlots = bookedSlots[selectedBarber] || [];
    return barberBookedSlots.some(
      (slot) =>
        slot.date === selectedDate.toDateString() && slot.time === time
    );
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
        <View style={styles.__barber_info_card_wrapper}>
          <View style={styles.__barber_info_card}>
            <View style={styles.__barber_header}>
              <Ionicons name="heart" size={20} color="#FFD700" />
              <View style={styles.__barber_name_container}>
                <Text style={styles.__barber_name}>{myBarberShop.name}</Text>
              </View>
              {currentBarber ? (
                <Text style={styles.__barber_hours_inline}>
                  {currentBarber.shiftStart} - {currentBarber.shiftEnd}
                </Text>
              ) : (
                <Text style={styles.__barber_hours_inline}>
                  {(() => {
                    const startTimes = barbers.map(b => b.shiftStart.split(':').map(Number));
                    const endTimes = barbers.map(b => b.shiftEnd.split(':').map(Number));
                    const earliestStart = startTimes.reduce((earliest, current) => {
                      const earliestMinutes = earliest[0] * 60 + earliest[1];
                      const currentMinutes = current[0] * 60 + current[1];
                      return currentMinutes < earliestMinutes ? current : earliest;
                    });
                    const latestEnd = endTimes.reduce((latest, current) => {
                      const latestMinutes = latest[0] * 60 + latest[1];
                      const currentMinutes = current[0] * 60 + current[1];
                      return currentMinutes > latestMinutes ? current : latest;
                    });
                    return `${earliestStart[0].toString().padStart(2, '0')}:${earliestStart[1].toString().padStart(2, '0')} - ${latestEnd[0].toString().padStart(2, '0')}:${latestEnd[1].toString().padStart(2, '0')}`;
                  })()}
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
                <Image
                  source={{ uri: currentBarber.image }}
                  style={styles.__barber_dropdown_image}
                />
                <Text style={styles.__barber_dropdown_text}>
                  {currentBarber.name}
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

                {barbers.map((barber) => (
                  <TouchableOpacity
                    key={barber.id}
                    style={[
                      styles.__dropdown_item,
                      selectedBarber === barber.id &&
                        styles.__dropdown_item_selected,
                    ]}
                    onPress={async () => {
                      setSelectedBarber(barber.id);
                      setShowBarberDropdown(false);
                      setSelectedTime(null);
                      // Save selected employee to storage
                      try {
                        await AsyncStorage.setItem('@berberi_selected_barber_employee_id', barber.id);
                      } catch (error) {
                        console.error('Error saving barber employee selection:', error);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: barber.image }}
                      style={styles.__dropdown_item_image}
                    />
                    <Text
                      style={[
                        styles.__dropdown_item_text,
                        selectedBarber === barber.id &&
                          styles.__dropdown_item_text_selected,
                      ]}
                    >
                      {barber.name}
                    </Text>
                    {selectedBarber === barber.id && (
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
              // Save reservation
              try {
                // If auto-select, find which barber actually has this time slot available (not booked)
                let actualBarber = currentBarber;
                if (!selectedBarber && selectedTime) {
                  const dateString = selectedDate.toDateString();
                  // Find the first barber who has this time slot available (within shift and not booked)
                  actualBarber = barbers.find(barber => {
                    // Check if time is within barber's shift
                    const startHour = parseInt(barber.shiftStart.split(':')[0]);
                    const startMinute = parseInt(barber.shiftStart.split(':')[1]) || 0;
                    const endHour = parseInt(barber.shiftEnd.split(':')[0]);
                    const endMinute = parseInt(barber.shiftEnd.split(':')[1]) || 0;
                    const slotLengthMinutes = barber.slotLengthMinutes || 60;
                    
                    const timeHour = parseInt(selectedTime.split(':')[0]);
                    const timeMinute = parseInt(selectedTime.split(':')[1]) || 0;
                    
                    const startTotalMinutes = startHour * 60 + startMinute;
                    const endTotalMinutes = endHour * 60 + endMinute;
                    const timeTotalMinutes = timeHour * 60 + timeMinute;
                    
                    // Check if time is within shift and there's enough time for the appointment
                    const isWithinShift = timeTotalMinutes >= startTotalMinutes && 
                                         timeTotalMinutes + slotLengthMinutes <= endTotalMinutes;
                    
                    if (!isWithinShift) return false;
                    
                    // Check if this slot is not booked for this barber
                    const barberBookedSlots = bookedSlots[barber.id] || [];
                    const isBooked = barberBookedSlots.some(
                      (slot) => slot.date === dateString && slot.time === selectedTime
                    );
                    
                    return !isBooked; // Return true if not booked
                  });
                }

                const reservation = {
                  barberName: actualBarber ? actualBarber.name : t('myBarber.autoSelect'),
                  shopName: myBarberShop.name,
                  barberImage: actualBarber ? actualBarber.image : null,
                  date: selectedDate.toISOString(),
                  time: selectedTime,
                  barberId: actualBarber ? actualBarber.id : null,
                  firstName: firstName.trim() || user?.firstName || (user?.name?.split(' ')[0] || ''),
                  lastName: lastName.trim() || user?.lastName || (user?.name?.split(' ').slice(1).join(' ') || ''),
                  customerId: user?.email || null,
                  comment: comment.trim() || '',
                  clientNumber: user?.phoneNumber || '',
                };

                // Load existing reservations
                const existingReservations = await AsyncStorage.getItem('@berberi_reservations');
                const reservations = existingReservations ? JSON.parse(existingReservations) : [];
                
                // Add new reservation
                reservations.push(reservation);
                
                // Save back to storage
                await AsyncStorage.setItem('@berberi_reservations', JSON.stringify(reservations));

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

                // After animation, navigate to reservations
                setTimeout(() => {
                  setShowSuccessAnimation(false);
                  scaleAnim.setValue(0);
                  opacityAnim.setValue(0);
                  navigation.navigate('MyReservations');
                  // Reset selection
                  setSelectedTime(null);
                }, 2000);
              } catch (error) {
                console.error('Error saving reservation:', error);
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

