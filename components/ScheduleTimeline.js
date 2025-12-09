import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import employeeService from '../services/employeeService';
import reservationService from '../services/reservationService';
import availabilityService from '../services/availabilityService';
import barberService from '../services/barberService';

const { width } = Dimensions.get('window');

// Helper to format date as YYYY-MM-DD
const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate overall shift times (earliest start to latest end)
const getOverallShift = (employees, shop) => {
  if (!employees || employees.length === 0) {
    // Fallback to shop shift times
    return {
      shiftStart: shop?.shiftStart || '09:00',
      shiftEnd: shop?.shiftEnd || '18:00',
      slotLengthMinutes: shop?.slotLengthMinutes || 30,
    };
  }
  
  const allStartTimes = employees.map(e => timeToMinutes(e.shiftStart || shop?.shiftStart || '09:00'));
  const allEndTimes = employees.map(e => timeToMinutes(e.shiftEnd || shop?.shiftEnd || '18:00'));
  const earliestStart = Math.min(...allStartTimes);
  const latestEnd = Math.max(...allEndTimes);
  
  // Get smallest slot length
  const slotLengths = employees.map(e => e.slotLengthMinutes || shop?.slotLengthMinutes || 30);
  const minSlotLength = Math.min(...slotLengths);
  
  return {
    shiftStart: minutesToTime(earliestStart),
    shiftEnd: minutesToTime(latestEnd),
    slotLengthMinutes: minSlotLength,
  };
};

// Helper to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// Helper to convert minutes to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Generate time slots for all barbers
const generateTimeSlots = (employees, shop) => {
  const overallShift = getOverallShift(employees, shop);
  const slots = [];
  const startMinutes = timeToMinutes(overallShift.shiftStart);
  const endMinutes = timeToMinutes(overallShift.shiftEnd);
  const slotLength = overallShift.slotLengthMinutes;
  
  let current = startMinutes;
  while (current + slotLength <= endMinutes) {
    slots.push({
      time: minutesToTime(current),
      minutes: current,
    });
    current += slotLength;
  }
  
  return slots;
};

const ScheduleTimeline = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [viewType, setViewType] = useState('inline'); // 'inline' or 'stacked'
  const [selectedBarber, setSelectedBarber] = useState(null); // null = Default (all barbers)
  const [showBarberDropdown, setShowBarberDropdown] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const [selectedBarberForReservation, setSelectedBarberForReservation] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [comment, setComment] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTimePosition, setCurrentTimePosition] = useState(null);
  const [currentSlotTime, setCurrentSlotTime] = useState(null); // Track which slot contains current time
  const [slotPositions, setSlotPositions] = useState({}); // Store Y positions of each slot
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef(null);
  const fullScreenScrollViewRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const lastScrollPositionRef = useRef(null);
  
  // Load shop and employees on mount
  useFocusEffect(
    React.useCallback(() => {
      loadShopData();
    }, [user])
  );

  // Load reservations when date or selected barber changes
  useEffect(() => {
    if (shop?.id) {
      loadReservations();
    }
  }, [selectedDate, selectedBarber, shop]);
  
  const loadShopData = async () => {
    try {
      setIsLoading(true);
      const shopId = user?.shopId;
      if (!shopId) {
        Alert.alert(
          t('schedule.errorTitle') || 'Error',
          t('schedule.noShop') || 'No shop associated with your account.'
        );
        return;
      }

      // Load shop details
      const shopData = await barberService.getBarberById(shopId);
      setShop(shopData);

      // Load employees
      const employeesData = await employeeService.getEmployees(shopId);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading shop data:', error);
      Alert.alert(
        t('schedule.errorTitle') || 'Error',
        error.message || t('schedule.loadError') || 'Failed to load shop data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = generateTimeSlots(employees, shop);

  // Helper function to scroll to current time
  const scrollToCurrentTime = useCallback((forceScroll = false) => {
    if (currentTimePosition === null) return;
    
    const targetRef = isFullScreen ? fullScreenScrollViewRef.current : scrollViewRef.current;
    
    if (targetRef !== null) {
      // Calculate target scroll position
      const targetScrollY = Math.max(0, currentTimePosition - 50); // 50px offset from top
      
      // Only scroll if position changed significantly (more than 10px) or if forced
      // This prevents unnecessary scrolling when the red line moves slightly
      if (forceScroll || lastScrollPositionRef.current === null || 
          Math.abs(targetScrollY - lastScrollPositionRef.current) > 10) {
        targetRef.scrollTo({
          y: targetScrollY,
          animated: true,
        });
        lastScrollPositionRef.current = targetScrollY;
      }
    }
  }, [currentTimePosition, isFullScreen]);

  // Store slot positions using onLayout
  const handleSlotLayout = useCallback((slotTime, event) => {
    const { y } = event.nativeEvent.layout;
    setSlotPositions(prev => {
      // Only update if position actually changed to prevent infinite loops
      if (prev[slotTime] === y) {
        return prev;
      }
      const newPositions = {
        ...prev,
        [slotTime]: y,
      };
      // Trigger scroll after positions are measured (if we have enough positions)
      setTimeout(() => {
        if (scrollViewRef.current !== null) {
          scrollToCurrentTime();
        }
      }, 100);
      return newPositions;
    });
  }, [scrollToCurrentTime]);

  // Calculate and update current time line position
  useEffect(() => {
    const calculateCurrentTimePosition = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Check if selected date is today
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      
      if (!isToday) {
        setCurrentTimePosition(null);
        setCurrentSlotTime(null);
        return;
      }

      // Get overall shift
      const overallShift = getOverallShift(employees, shop);
      const shiftStartMinutes = timeToMinutes(overallShift.shiftStart);
      const shiftEndMinutes = timeToMinutes(overallShift.shiftEnd);
      const slotLength = overallShift.slotLengthMinutes;

      // Check if current time is within shift hours
      if (currentMinutes < shiftStartMinutes || currentMinutes >= shiftEndMinutes) {
        setCurrentTimePosition(null);
        setCurrentSlotTime(null);
        return;
      }

      // Find the slot that contains current time
      let currentSlot = null;
      let nextSlot = null;
      
      for (let i = 0; i < timeSlots.length; i++) {
        const slot = timeSlots[i];
        const slotStartMinutes = slot.minutes;
        const slotEndMinutes = slotStartMinutes + slotLength;
        
        if (currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes) {
          currentSlot = slot;
          // Get next slot if exists
          if (i + 1 < timeSlots.length) {
            nextSlot = timeSlots[i + 1];
          }
          break;
        }
      }

      if (!currentSlot) {
        setCurrentTimePosition(null);
        setCurrentSlotTime(null);
        return;
      }

      // Get actual Y positions from measured layouts
      const currentSlotY = slotPositions[currentSlot.time];
      const nextSlotY = nextSlot ? slotPositions[nextSlot.time] : null;

      if (currentSlotY === undefined) {
        // Positions not measured yet, wait for layout
        setCurrentTimePosition(null);
        setCurrentSlotTime(null);
        return;
      }

      // Calculate minutes from start of current slot
      const minutesFromSlotStart = currentMinutes - currentSlot.minutes;
      const proportion = minutesFromSlotStart / slotLength; // 0 to 1

      let yPosition;
      if (nextSlotY !== null && nextSlotY !== undefined) {
        // Interpolate between current and next slot positions
        const slotHeight = nextSlotY - currentSlotY;
        yPosition = currentSlotY + (proportion * slotHeight);
      } else {
        // No next slot, use estimated height (fallback)
        const estimatedSlotHeight = 40; // minHeight
        yPosition = currentSlotY + (proportion * estimatedSlotHeight);
      }
      
      setCurrentTimePosition(yPosition);
      setCurrentSlotTime(currentSlot.time); // Store the current slot time for highlighting
    };

    // Calculate immediately
    calculateCurrentTimePosition();

    // Update every 5 seconds
    timeUpdateIntervalRef.current = setInterval(calculateCurrentTimePosition, 5000);

    // Cleanup function
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
  }, [selectedDate, timeSlots, slotPositions, viewType, reservations]);

  // Auto-scroll to current time position when it changes (only on date change or initial load)
  // Don't auto-scroll on every position update to avoid jumping to 0,0
  useEffect(() => {
    if (currentTimePosition === null) {
      return;
    }

    const targetRef = isFullScreen ? fullScreenScrollViewRef.current : scrollViewRef.current;
    if (targetRef === null) {
      return;
    }

    // Small delay to ensure layout is complete, especially on initial load
    const timer = setTimeout(() => {
      scrollToCurrentTime(true); // Force scroll on date change or initial load
    }, 600); // Wait for layout to complete

    return () => clearTimeout(timer);
  }, [selectedDate, scrollToCurrentTime, isFullScreen]); // Removed currentTimePosition from dependencies

  // Auto-scroll when screen is opened/focused
  useFocusEffect(
    useCallback(() => {
      // Retry mechanism to wait for currentTimePosition to be calculated
      let retryCount = 0;
      const maxRetries = 15; // Try for up to 7.5 seconds (15 * 500ms)
      
      const tryScroll = () => {
        const targetRef = isFullScreen ? fullScreenScrollViewRef.current : scrollViewRef.current;
        if (currentTimePosition !== null && targetRef !== null) {
          scrollToCurrentTime();
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(tryScroll, 500); // Retry every 500ms
        }
      };

      // Start trying after a short delay to let layout complete
      const timer = setTimeout(tryScroll, 800);

      return () => clearTimeout(timer);
    }, [scrollToCurrentTime, isFullScreen]) // Removed currentTimePosition to prevent scroll on every update
  );

  // Auto-scroll every 5 minutes
  useEffect(() => {
    const autoScrollInterval = setInterval(() => {
      if (currentTimePosition !== null) {
        scrollToCurrentTime(true); // Force scroll every 5 minutes
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(autoScrollInterval);
  }, [currentTimePosition, scrollToCurrentTime, isFullScreen]);
  
  const loadReservations = async () => {
    try {
      if (!shop?.id) return;

      const dateString = formatDateForAPI(selectedDate);
      const params = {
        shopId: shop.id,
        date: dateString,
      };

      if (selectedBarber) {
        params.barberId = selectedBarber;
      }

      const reservationsData = await reservationService.getReservations(params);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading reservations:', error);
      Alert.alert(
        t('schedule.errorTitle') || 'Error',
        error.message || t('schedule.loadReservationsError') || 'Failed to load reservations.'
      );
      setReservations([]);
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
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  const getReservationsForSlot = (slot) => {
    // Get all reservations for this time slot
    let slotReservations = reservations.filter(res => res.time === slot.time);
    
    // Filter by selected barber if one is selected
    if (selectedBarber) {
      slotReservations = slotReservations.filter(res => res.barberId === selectedBarber);
    }
    
    return slotReservations;
  };
  
  // Check if a barber is available for a specific time slot
  const isBarberAvailable = (barberId, slotTime) => {
    const dateString = selectedDate.toDateString();
    const isBooked = reservations.some(
      res => res.barberId === barberId && 
             res.time === slotTime &&
             new Date(res.date).toDateString() === dateString
    );
    return !isBooked;
  };
  
  // Get available barbers for a time slot
  const getAvailableBarbers = (slotTime) => {
    if (!employees || employees.length === 0) return [];
    
    return employees.filter(employee => {
      // Check if employee is within their shift
      const slotMinutes = timeToMinutes(slotTime);
      const startMinutes = timeToMinutes(employee.shiftStart || shop?.shiftStart || '09:00');
      const endMinutes = timeToMinutes(employee.shiftEnd || shop?.shiftEnd || '18:00');
      const slotLength = employee.slotLengthMinutes || shop?.slotLengthMinutes || 60;
      
      const isWithinShift = slotMinutes >= startMinutes && 
                           slotMinutes + slotLength <= endMinutes;
      
      if (!isWithinShift) return false;
      
      // Check if employee is not already booked
      return isBarberAvailable(employee.id, slotTime);
    });
  };
  
  const toggleViewType = () => {
    setViewType(prev => prev === 'inline' ? 'stacked' : 'inline');
  };
  
  const handleOpenReservationModal = (slotTime) => {
    setSelectedSlotTime(slotTime);
    setSelectedBarberForReservation(null);
    setFirstName('');
    setShowReservationModal(true);
  };
  
  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReservationDetail(true);
  };
  
  const handleSaveReservation = async () => {
    if (!selectedBarberForReservation || !selectedSlotTime || !shop?.id) return;
    
    try {
      const reservationData = {
        shopId: shop.id,
        barberId: selectedBarberForReservation,
        date: formatDateForAPI(selectedDate), // Use YYYY-MM-DD format, not ISO string
        time: selectedSlotTime,
        firstName: firstName.trim() || 'Klienti',
        lastName: lastName.trim() || '',
        comment: comment.trim() || '',
        clientNumber: clientNumber.trim() || '',
      };

      await reservationService.createReservation(reservationData);
      
      // Reload reservations
      await loadReservations();
      
      // Close modal and reset
      setShowReservationModal(false);
      setSelectedSlotTime(null);
      setSelectedBarberForReservation(null);
      setFirstName('');
      setLastName('');
      setComment('');
      setClientNumber('');
    } catch (error) {
      console.error('Error saving reservation:', error);
      Alert.alert(
        t('schedule.errorTitle') || 'Error',
        error.message || t('schedule.saveReservationError') || 'Failed to save reservation.'
      );
    }
  };

  const ScheduleContent = ({ isFullScreenMode = false }) => (
    <>
      {/* Controls */}
      <View style={[styles.__header_controls, isFullScreenMode && styles.__header_controls_fullscreen]}>
        {!isFullScreenMode && (
          <>
            {/* Barber Selector - Top */}
            <View style={styles.__barber_selector_row}>
              <TouchableOpacity
                style={styles.__barber_selector}
                onPress={() => setShowBarberDropdown(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={18} color="#FFD700" />
                <Text style={styles.__barber_selector_text} numberOfLines={1}>
                  {selectedBarber ? employees.find(e => e.id === selectedBarber)?.name || 'Barber' : 'Default'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#FFD700" />
              </TouchableOpacity>
              
              {/* Full Screen Button - Inline */}
              <TouchableOpacity
                style={styles.__fullscreen_button_inline}
                onPress={() => setIsFullScreen(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="expand" size={18} color="#FFD700" />
              </TouchableOpacity>
            </View>
            
            {/* Date and View Toggle */}
            <View style={styles.__controls_row}>
              <TouchableOpacity
                style={styles.__date_selector}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#FFD700" />
                <Text style={styles.__date_text}>{formatDate(selectedDate)}</Text>
                <Ionicons name="chevron-down" size={20} color="#FFD700" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.__view_toggle}
                onPress={toggleViewType}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={viewType === 'inline' ? 'grid-outline' : 'list-outline'} 
                  size={20} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {isFullScreenMode && (
          <View style={styles.__fullscreen_controls_row}>
            <View style={styles.__fullscreen_spacer} />
            <TouchableOpacity
              style={styles.__view_toggle}
              onPress={toggleViewType}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={viewType === 'inline' ? 'grid-outline' : 'list-outline'} 
                size={20} 
                color="#FFD700" 
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Barber Selection Dropdown */}
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
              onPress={() => {
                setSelectedBarber(null);
                setShowBarberDropdown(false);
              }}
            >
              <View style={styles.__auto_select_icon}>
                <Ionicons name="apps-outline" size={20} color="#FFD700" />
              </View>
              <Text
                style={[
                  styles.__dropdown_item_text,
                  !selectedBarber && styles.__dropdown_item_text_selected,
                ]}
              >
                Default
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
                  selectedBarber === employee.id && styles.__dropdown_item_selected,
                ]}
                onPress={() => {
                  setSelectedBarber(employee.id);
                  setShowBarberDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.__dropdown_item_text,
                    selectedBarber === employee.id && styles.__dropdown_item_text_selected,
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
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
            }
          }}
          minimumDate={new Date()}
        />
      )}
      
      {/* Reservation Modal */}
      <Modal
        visible={showReservationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReservationModal(false)}
      >
        <TouchableOpacity
          style={styles.__modal_overlay}
          activeOpacity={1}
          onPress={() => setShowReservationModal(false)}
        >
          <TouchableOpacity
            style={styles.__reservation_modal_container}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.__reservation_modal_header}>
              <Text style={styles.__reservation_modal_title}>New Reservation</Text>
              <TouchableOpacity
                onPress={() => setShowReservationModal(false)}
                style={styles.__reservation_modal_close}
              >
                <Ionicons name="close" size={24} color="#FFD700" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.__reservation_time_container}>
              <Ionicons name="time-outline" size={32} color="#FFD700" style={styles.__reservation_time_icon} />
              <Text style={styles.__reservation_modal_time}>
                {selectedSlotTime}
              </Text>
            </View>
            
            <Text style={styles.__reservation_modal_label}>Select Barber:</Text>
            <View style={styles.__reservation_barber_buttons}>
              {selectedSlotTime && getAvailableBarbers(selectedSlotTime).map((employee) => (
                <TouchableOpacity
                  key={employee.id}
                  style={[
                    styles.__reservation_barber_button,
                    selectedBarberForReservation === employee.id && styles.__reservation_barber_button_selected,
                  ]}
                  onPress={() => setSelectedBarberForReservation(employee.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.__reservation_barber_button_text,
                      selectedBarberForReservation === employee.id && styles.__reservation_barber_button_text_selected,
                    ]}
                  >
                    {employee.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.__reservation_label_row}>
              <Text style={styles.__reservation_modal_label}>{t('barberAdmin.clientName') || 'Client Name'}:</Text>
              <Text style={styles.__reservation_optional_label}>({t('myBarber.optional') || 'optional'})</Text>
            </View>
            <TextInput
              style={styles.__reservation_client_input}
              placeholder={t('barberAdmin.clientNamePlaceholder') || 'Enter client name'}
              placeholderTextColor="rgba(255, 215, 0, 0.5)"
              value={firstName}
              onChangeText={setFirstName}
            />
            
            <TouchableOpacity
              style={[
                styles.__reservation_save_button,
                !selectedBarberForReservation && styles.__reservation_save_button_disabled,
              ]}
              onPress={handleSaveReservation}
              disabled={!selectedBarberForReservation}
              activeOpacity={0.7}
            >
              <Text style={styles.__reservation_save_button_text}>Save</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Reservation Detail Modal */}
      <Modal
        visible={showReservationDetail}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReservationDetail(false)}
      >
        <TouchableOpacity
          style={styles.__modal_overlay}
          activeOpacity={1}
          onPress={() => setShowReservationDetail(false)}
        >
          <TouchableOpacity
            style={styles.__reservation_modal_container}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.__reservation_modal_header}>
              <Text style={styles.__reservation_modal_title}>Reservation Details</Text>
              <TouchableOpacity
                onPress={() => setShowReservationDetail(false)}
                style={styles.__reservation_modal_close}
              >
                <Ionicons name="close" size={24} color="#FFD700" />
              </TouchableOpacity>
            </View>
            
            {selectedReservation && (
              <>
                <View style={styles.__reservation_detail_row}>
                  <Text style={styles.__reservation_detail_label}>Time:</Text>
                  <Text style={styles.__reservation_detail_value}>{selectedReservation.time}</Text>
                </View>
                
                <View style={styles.__reservation_detail_row}>
                  <Text style={styles.__reservation_detail_label}>Date:</Text>
                  <Text style={styles.__reservation_detail_value}>
                    {new Date(selectedReservation.date).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.__reservation_detail_row}>
                  <Text style={styles.__reservation_detail_label}>Barber:</Text>
                  <Text style={styles.__reservation_detail_value}>
                    {selectedReservation.barberName || 'Barber'}
                  </Text>
                </View>
                
                <View style={styles.__reservation_detail_row}>
                  <Text style={styles.__reservation_detail_label}>Client Name:</Text>
                  <Text style={styles.__reservation_detail_value}>
                    {selectedReservation.firstName && selectedReservation.lastName
                      ? `${selectedReservation.firstName} ${selectedReservation.lastName}`.trim()
                      : selectedReservation.firstName || selectedReservation.lastName || selectedReservation.customerName || 'Klienti'}
                  </Text>
                </View>
                
                {selectedReservation.clientNumber && (
                  <View style={styles.__reservation_detail_row}>
                    <Text style={styles.__reservation_detail_label}>Client Number:</Text>
                    <Text style={styles.__reservation_detail_value}>
                      {selectedReservation.clientNumber}
                    </Text>
                  </View>
                )}
                
                {selectedReservation.comment && (
                  <View style={styles.__reservation_detail_comment_row}>
                    <Text style={styles.__reservation_detail_label}>Comment:</Text>
                    <Text style={styles.__reservation_detail_comment}>
                      {selectedReservation.comment}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.__cancel_reservation_button}
                  onPress={async () => {
                    Alert.alert(
                      t('schedule.cancelTitle') || 'Cancel Reservation',
                      t('schedule.cancelMessage') || 'Are you sure you want to cancel this reservation?',
                      [
                        {
                          text: t('schedule.no') || 'No',
                          style: 'cancel',
                        },
                        {
                          text: t('schedule.yes') || 'Yes',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await reservationService.cancelReservation(selectedReservation.id);
                              await loadReservations();
                              setShowReservationDetail(false);
                              Alert.alert(
                                t('schedule.cancelSuccessTitle') || 'Reservation Canceled',
                                t('schedule.cancelSuccessMessage') || 'Reservation has been canceled successfully.'
                              );
                            } catch (error) {
                              Alert.alert(
                                t('schedule.errorTitle') || 'Error',
                                error.message || t('schedule.cancelError') || 'Failed to cancel reservation.'
                              );
                            }
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.__cancel_reservation_button_text}>
                    {t('schedule.cancelReservation') || 'Cancel Reservation'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Timeline */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.__timeline_container}
        contentContainerStyle={styles.__timeline_content}
        showsVerticalScrollIndicator={false}
      >
        {/* Time labels and slots */}
        <View style={styles.__timeline}>
          {/* Current time indicator line */}
          {currentTimePosition !== null && (
            <View style={[styles.__current_time_line, { top: currentTimePosition }]} />
          )}
          
          {timeSlots.map((slot, index) => {
            const slotReservations = getReservationsForSlot(slot);
            const hasReservations = slotReservations.length > 0;
            const availableBarbers = getAvailableBarbers(slot.time);
            const hasAvailableBarbers = availableBarbers.length > 0;
            
            return (
              <View 
                key={slot.time} 
                style={styles.__time_slot_row}
                onLayout={(event) => handleSlotLayout(slot.time, event)}
              >
                {/* Time label */}
                <View style={[
                  styles.__time_label_container,
                  currentSlotTime === slot.time && styles.__time_label_container_current
                ]}>
                  <Text style={styles.__time_label}>{slot.time}</Text>
                </View>
                
                {/* Slot area */}
                <View style={styles.__slot_area}>
                  {/* Slot indicator line */}
                  <View style={styles.__slot_line} />
                  
                  {/* Multiple reservation boxes if exists */}
                  {hasReservations && (
                    <View style={[
                      styles.__reservations_container,
                      viewType === 'inline' && styles.__reservations_container_inline,
                      viewType === 'stacked' && styles.__reservations_container_stacked,
                    ]}>
                      {slotReservations.map((reservation, resIndex) => {
                        // Create a unique key using time, barberId, customerId, and index
                        const uniqueKey = `${reservation.time}-${reservation.barberId || 'unknown'}-${reservation.customerId || resIndex}-${resIndex}`;
                        return (
                          <View 
                            key={uniqueKey} 
                            style={[
                              styles.__reservation_box,
                              viewType === 'inline' && styles.__reservation_box_inline,
                              viewType === 'stacked' && styles.__reservation_box_stacked,
                            ]}
                          >
                          <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            style={styles.__reservation_gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <TouchableOpacity
                              onPress={() => handleReservationClick(reservation)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.__reservation_content_row}>
                                <Text style={styles.__reservation_time}>{reservation.time}</Text>
                                <Text style={styles.__reservation_barber} numberOfLines={1}>
                                  {reservation.barberName || 'Barber'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                        </View>
                        );
                      })}
                    </View>
                  )}
                  
                  {/* Show + button if there are available barbers */}
                  {hasAvailableBarbers && (
                    <TouchableOpacity
                      style={styles.__empty_slot}
                      onPress={() => handleOpenReservationModal(slot.time)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={18} color="rgba(255, 215, 0, 0.5)" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Empty state */}
        {reservations.length === 0 && (
          <View style={styles.__empty_state}>
            <Ionicons name="calendar-outline" size={48} color="rgba(255, 215, 0, 0.3)" />
            <Text style={styles.__empty_state_text}>
              {t('barberAdmin.noReservations')}
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  return (
    <View style={styles.__container}>
      <ScheduleContent isFullScreenMode={false} />

      {/* Full Screen Modal */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullScreen(false)}
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.__fullscreen_container}
        >
          <StatusBar style="light" />
          {/* Exit Full Screen Button */}
          <TouchableOpacity
            style={styles.__exit_fullscreen_button}
            onPress={() => setIsFullScreen(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="contract" size={24} color="#FFD700" />
            <Text style={styles.__exit_fullscreen_text}>
              {t('barberAdmin.exitFullScreen') || 'Exit Full Screen'}
            </Text>
          </TouchableOpacity>

          <ScrollView
            ref={fullScreenScrollViewRef}
            style={styles.__fullscreen_scroll}
            contentContainerStyle={styles.__fullscreen_content}
            showsVerticalScrollIndicator={false}
          >
            <ScheduleContent isFullScreenMode={true} />
          </ScrollView>
        </LinearGradient>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  __container: {
    flex: 1,
    position: 'relative',
  },
  __barber_selector_row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  __fullscreen_button_inline: {
    padding: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  __fullscreen_controls_row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  __fullscreen_spacer: {
    flex: 1,
  },
  __fullscreen_container: {
    flex: 1,
  },
  __exit_fullscreen_button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
    gap: 8,
  },
  __exit_fullscreen_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __fullscreen_scroll: {
    flex: 1,
  },
  __fullscreen_content: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    paddingBottom: 20,
  },
  __header_controls: {
    marginTop: 0,
    marginBottom: 16,
    gap: 12,
  },
  __header_controls_fullscreen: {
    marginTop: 0,
    marginBottom: 8,
    gap: 0,
  },
  __controls_row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  __date_selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 6,
  },
  __date_text: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    flex: 1,
    textAlign: 'center',
  },
  __barber_selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 6,
  },
  __barber_selector_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    flex: 1,
    textAlign: 'center',
  },
  __view_toggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __modal_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  __dropdown_container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 250,
    maxWidth: '80%',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  __dropdown_item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  __dropdown_item_selected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  __dropdown_item_text: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  __dropdown_item_text_selected: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __auto_select_icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  __timeline_container: {
    flex: 1,
  },
  __timeline_content: {
    paddingHorizontal: 0,
    paddingBottom: 0, // Remove bottom padding to eliminate empty space
  },
  __timeline: {
    position: 'relative',
    // Removed minHeight to allow natural content height
  },
  __current_time_line: {
    position: 'absolute',
    left: 64, // Start after time label (60px) + margin (4px)
    right: -15, // Extend to account for parent padding (min 20px) to reach 5px from screen edge
    height: 2,
    backgroundColor: '#EF4444',
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  __time_slot_row: {
    flexDirection: 'row',
    marginBottom: 4,
    minHeight: 40,
  },
  __time_label_container: {
    width: 60,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15, // Higher than the red line (zIndex: 10) so it appears on top
    backgroundColor: '#1a1a2e', // Match the general background color
    borderTopLeftRadius: 10, // Roundy only on left side
    borderBottomLeftRadius: 10, // Roundy only on left side
    marginRight: 4, // Add some spacing from the slot area
  },
  __time_label_container_current: {
    backgroundColor: 'rgba(68, 162, 239, 0.3)', // Red tint for current time slot
    borderWidth: 1,
    borderColor: 'rgba(68, 162, 239, 0.6)', // Red border
  },
  __time_label: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  __slot_area: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 20,
    minHeight: 40,
    position: 'relative',
  },
  __slot_line: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: 1,
  },
  __empty_slot: {
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    borderStyle: 'dashed',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  __reservations_container: {
    marginTop: 2,
  },
  __reservations_container_inline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  __reservations_container_stacked: {
    flexDirection: 'column',
    gap: 4,
  },
  __reservation_box: {
    minHeight: 32,
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  __reservation_box_inline: {
    flex: 1,
    minWidth: width * 0.25, // Minimum width for inline boxes
    maxWidth: '100%',
  },
  __reservation_box_stacked: {
    width: '100%',
  },
  __reservation_gradient: {
    width: '100%',
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  __reservation_content_row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  __reservation_time: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a1a2e',
  },
  __reservation_barber: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 4,
  },
  __empty_state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  __empty_state_text: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    textAlign: 'center',
  },
  __reservation_modal_container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 12,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __reservation_modal_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  __reservation_modal_title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
  },
  __reservation_modal_close: {
    padding: 4,
  },
  __reservation_time_container: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  __reservation_time_icon: {
    opacity: 0.8,
    alignSelf: 'center',
  },
  __reservation_modal_time: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 36,
  },
  __reservation_label_row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    marginTop: 4,
  },
  __reservation_modal_label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __reservation_optional_label: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 215, 0, 0.7)',
    fontStyle: 'italic',
  },
  __reservation_barber_buttons: {
    gap: 6,
    marginBottom: 4,
  },
  __reservation_barber_button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
  },
  __reservation_barber_button_selected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  __reservation_barber_button_text: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 215, 0, 0.7)',
  },
  __reservation_barber_button_text_selected: {
    color: '#FFD700',
    fontFamily: 'Poppins_600SemiBold',
  },
  __reservation_client_input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
  },
  __reservation_save_button: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  __reservation_save_button_disabled: {
    opacity: 0.5,
  },
  __reservation_save_button_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __reservation_input_row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  __reservation_input_half: {
    flex: 1,
  },
  __reservation_client_input_multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  __reservation_detail_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  __reservation_detail_label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    flex: 1,
  },
  __reservation_detail_value: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  __reservation_detail_comment_row: {
    marginTop: 8,
  },
  __reservation_detail_comment: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
});

export default ScheduleTimeline;

