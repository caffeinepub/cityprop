# Specification

## Summary
**Goal:** Add an Uber-like trip status workflow (accept → en route → arrived → in progress → completed) for drivers and a clear trip-progress view for clients, without GPS/maps.

**Planned changes:**
- Update the Driver Dashboard trip UI to support an “Active Request / Active Trip” lifecycle: allow “Accept” on pending trips and then sequential status updates (En Route, Arrived, In Progress, Completed) using the existing `updateTripStatus(tripId, newStatus, statusUpdate)` API and existing trip/status types.
- Prevent invalid driver actions in the UI (e.g., no driver cancel controls; customer-only cancellation remains unchanged).
- Add/extend client trip cards and/or trip details to display current trip step and the latest driver status update message/summary, including completed-trip summaries while omitting driver-only financial info.
- Add/extend React Query hooks around existing trip queries and `updateTripStatus` so client/driver lists and detail views refresh automatically after status changes, with errors shown via existing toast/error patterns.
- Wire any new user-facing text for these controls through the existing i18n system in English.

**User-visible outcome:** Drivers can move an assigned trip through a guided Uber-like status flow with optional messages, and clients can see the current trip step plus the most recent driver update/completion summary—without maps or live tracking.
