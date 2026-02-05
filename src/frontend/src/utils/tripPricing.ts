// Trip pricing utility for manual mileage-based pricing
// No GPS/map distance calculation - miles are manually entered/confirmed

const DISTANCE_BASED_DEPOSIT = 10;
const DISTANCE_BASED_SERVICE_FEE = 25;
const MAX_DISTANCE_MILES = 10;

export interface TripPricing {
  deposit: number;
  serviceFee: number;
  total: number;
  driverEarnings: number;
  companyFee: number;
}

/**
 * Calculate pricing breakdown from manually entered miles
 * Rule: miles <= 10 → deposit=$10 and service fee=$25
 */
export function calculateTripPricing(miles: number | null | undefined): TripPricing {
  // Default pricing when no miles provided or miles exceed limit
  if (miles === null || miles === undefined || miles > MAX_DISTANCE_MILES) {
    return {
      deposit: 0,
      serviceFee: 0,
      total: 0,
      driverEarnings: 0,
      companyFee: 0,
    };
  }

  // Distance-based pricing for trips <= 10 miles
  const deposit = DISTANCE_BASED_DEPOSIT;
  const serviceFee = DISTANCE_BASED_SERVICE_FEE;
  const companyFee = 7;
  const driverEarnings = serviceFee - companyFee;
  const total = deposit + serviceFee;

  return {
    deposit,
    serviceFee,
    total,
    driverEarnings,
    companyFee,
  };
}

/**
 * Check if miles value is valid for booking
 */
export function isValidMilesForBooking(miles: number | null | undefined): boolean {
  if (miles === null || miles === undefined) return false;
  return miles > 0 && miles <= MAX_DISTANCE_MILES;
}

/**
 * Get the maximum allowed distance in miles
 */
export function getMaxDistanceMiles(): number {
  return MAX_DISTANCE_MILES;
}
