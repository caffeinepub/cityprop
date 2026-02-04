# Specification

## Summary
**Goal:** Add pickup/dropoff address capture with coordinate-based distance calculation, enforce a fixed $10 deposit + $25 fee for trips up to 10 miles (including Shopping), and persist trip location/distance details.

**Planned changes:**
- Update the booking UI to require Pickup address and Dropoff address inputs.
- Add UI actions to capture/set pickup and dropoff coordinates from the browser (e.g., “Use current location” buttons for each address) and compute/display estimated miles when both coordinates exist.
- Block booking/checkout when distance cannot be calculated (missing coordinates) and show a clear English message prompting the user to set coordinates.
- Enforce pricing for distance <= 10 miles: $10 non-refundable deposit + $25 service fee (total $35), applying the same rule to Shopping bookings.
- If calculated distance > 10 miles, block submission and show an English validation message that bookings are limited to 10 miles at this time.
- Ensure Stripe checkout line items reflect the $10 deposit (in cents) and no additional mileage charges for the <= 10 mile case.
- Add explicit English copy in the booking flow stating the $10 deposit is non-refundable even if the customer cancels (shown before redirecting to Stripe).
- Persist pickup/dropoff addresses, coordinates (when available), and computed distance on the backend Trip record (Trip.distance and Trip.locationDetails).

**User-visible outcome:** Customers can enter pickup and dropoff addresses, set coordinates via GPS for each, see the calculated miles and a $35 breakdown (with non-refundable deposit notice) for trips up to 10 miles, and are prevented from booking if distance can’t be calculated or exceeds 10 miles.
