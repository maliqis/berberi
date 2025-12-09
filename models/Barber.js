/**
 * Barber Model
 * Represents a barber shop/barbershop
 */
export class Barber {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image || null;
    this.isOpen = data.isOpen || false;
    this.shiftStart = data.shiftStart || '09:00';
    this.shiftEnd = data.shiftEnd || '18:00';
    this.nextAvailableSlot = data.nextAvailableSlot || 0; // 0 = today, 1 = tomorrow, 2+ = in X days
    this.address = data.address || null;
    this.phone = data.phone || null;
    this.rating = data.rating || null;
    this.description = data.description || null;
  }

  /**
   * Create Barber instance from API response
   */
  static fromApiResponse(data) {
    return new Barber(data);
  }

  /**
   * Create array of Barber instances from API response
   */
  static fromApiResponseArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      return [];
    }
    return dataArray.map(item => Barber.fromApiResponse(item));
  }
}

export default Barber;

