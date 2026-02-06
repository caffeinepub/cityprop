# Specification

## Summary
**Goal:** Fix and complete the driver accept/decline flow for pending trip requests, including correct visibility of assigned pending trips and persisting a driver-provided decline reason.

**Planned changes:**
- Backend: Update pending-trip query logic so trips with `tripStatus = pending` and `driverId` set to the driver are returned for that driver.
- Backend: Adjust `acceptAndClaimTrip(tripId)` rules to allow accepting pending trips when `driverId` is null or matches the caller, and reject when assigned to a different driver; update trip to `tripStatus = accepted` and set `driverId = caller` if needed.
- Backend: Adjust `declineTrip` to only allow declining pending trips for the assigned driver (or unassigned if applicable per existing behavior), set `tripStatus = cancelled`, and reject invalid states/driver mismatch.
- Backend: Extend `declineTrip` to accept a driver-provided reason string and persist it in the trip’s cancelled status update so it appears via existing trip retrieval APIs (e.g., `getTrip`, `getClientTrips`, `getDriverTrips`) and is preserved on refetch.
- Frontend: Update the driver decline action in `TripDetailsDialog` to send the typed decline reason to the backend and handle success without errors.
- Frontend: Ensure trip lists refresh correctly after accept/decline so pending requests disappear from “New Requests (Pending)”, accepted trips appear in “My Trips”, and the customer’s trip list reflects updated status via existing polling/invalidation behavior.
- Frontend: Ensure any user-facing strings introduced/changed are in English.

**User-visible outcome:** Drivers can see pending trips assigned to them, accept or decline them without getting stuck, provide a decline reason that is stored and visible in trip details, and both driver and customer trip lists reflect the updated status after actions.
