# Production Publish Checklist - Draft Version 29

## Overview
This document outlines the verification steps for promoting Draft Version 29 to production. The primary goal is to confirm that all core UI routes render successfully and the application functions as expected in the production environment.

## Pre-Publish Verification

### 1. Build Status
- [ ] Draft Version 29 build completed successfully
- [ ] No build errors or warnings in the deployment logs
- [ ] All assets (images, videos, fonts) are properly bundled

### 2. Backend Connectivity
- [ ] Backend canister is deployed and accessible
- [ ] Internet Identity integration is functional
- [ ] Stripe configuration is set (if applicable)

## Post-Publish Verification Checklist

### Core Authentication Flow
- [ ] **Landing Page (Logged Out)**
  - Navigate to production URL
  - Verify LandingPage component renders with:
    - Cityprop logo (enlarged: h-56 w-56 mobile, h-64 w-64 tablet, h-72 w-72 desktop)
    - Gold tagline styling
    - Video section with max-w-4xl container
    - Features grid
    - Services pricing details
    - Call-to-action sections with black-and-gold theme
  - Verify "Watch how it works" footer link scrolls to top
  - Test Login button functionality

- [ ] **Authentication Process**
  - Click Login button
  - Verify Internet Identity modal appears
  - Complete authentication flow
  - Confirm successful login (no errors in console)

### Role Selection & Profile Setup
- [ ] **RoleSelectionModal (First-Time Users)**
  - Verify modal appears immediately after authentication for new users
  - Test Customer role selection
  - Test Driver role selection
  - Confirm modal uses AppRole enum correctly

- [ ] **ProfileSetupModal**
  - Verify modal appears after role selection for users without profiles
  - Test profile creation with required fields:
    - Name
    - Phone number
    - Coordinates
  - For Driver role:
    - Verify driver-specific fields appear
    - Test photo upload functionality
  - Confirm profile saves successfully
  - Verify no flash/flicker during profile check (proper loading states)

### Dashboard Routing (Role-Based)
- [ ] **Customer Dashboard** (`/client-dashboard`)
  - Verify dashboard renders for users with Customer role
  - Check service booking interface displays
  - Verify trip list shows with:
    - Current progress step
    - Latest driver message preview
  - Test TripDetailsDialog integration
  - Verify active/completed service stats
  - Check contact information and location details

- [ ] **Driver Dashboard** (`/driver-dashboard`)
  - Verify dashboard renders for users with Driver role
  - Check instructional video displays
  - Verify earnings summary with $7 company fee breakdown
  - Check completed services stats
  - Verify payment status tracking
  - Test wallet access
  - Verify trip list shows with progress and messages
  - Test TripDetailsDialog integration

- [ ] **Admin Dashboard** (`/admin-dashboard`)
  - Verify dashboard renders for admin users
  - Check user approval management interface
  - Test "Company Wallet" button (proper ES6 import)
  - Verify company earnings summary displays:
    - Commission breakdown
    - Deposit breakdown
    - Gold-accented cards

### Cross-Role Access Prevention
- [ ] Verify Customer cannot access Driver Dashboard
- [ ] Verify Driver cannot access Customer Dashboard
- [ ] Verify non-admin users cannot access Admin Dashboard
- [ ] Test proper error handling for unauthorized access attempts

### Approval Flow (Driver-Specific)
- [ ] **ApprovalPendingScreen**
  - For unapproved drivers, verify screen displays with:
    - Approval pending status message
    - Email instructions (cityprop01@gmail.com)
    - Driver requirements (18+, valid license, clean car, professional dress)
    - Next steps information
  - Verify approved drivers bypass this screen

### Stripe Integration
- [ ] **StripeSetupCheck (Admin)**
  - Verify Stripe configuration check on admin login
  - If not configured, test setup modal displays
  - Test Stripe secret key and allowed countries input
  - Verify configuration saves successfully

- [ ] **Payment Flow**
  - Test booking with deposit payment
  - Verify Stripe checkout session creation
  - Test redirect to Stripe payment page
  - Verify `/payment-success` route renders PaymentSuccess component
  - Verify `/payment-failure` route renders PaymentFailure component
  - Test payment status updates in backend

### Internationalization (i18n)
- [ ] Verify language detection works (browser language)
- [ ] Test language switching (English, Spanish, French)
- [ ] Check stored language preference persists
- [ ] Verify all UI strings translate correctly

### Visual Design & Theme
- [ ] **Black-and-Gold Theme**
  - Verify gold color palette (50-900 shades) applies correctly
  - Check custom gold shadow utilities (shadow-gold, shadow-gold-lg)
  - Test shimmer animation on premium elements
  - Verify neutral text colors (dark gray light mode, light gray/white dark mode)

- [ ] **Dark/Light Mode**
  - Test theme toggle in header
  - Verify OKLCH color system works in both modes
  - Check contrast ratios meet AA+ standards

- [ ] **Responsive Design**
  - Test on mobile viewport (320px, 375px, 414px)
  - Test on tablet viewport (768px, 1024px)
  - Test on desktop viewport (1280px, 1920px)
  - Verify header responsiveness
  - Check footer layout on all screen sizes

### Assets & Media
- [ ] Verify all static assets load from `/assets/` directory
- [ ] Check generated images load from `/assets/generated/`
- [ ] Test video player functionality:
  - Enlarged play button overlay (h-32 w-32)
  - Autoplay muted preview
  - Play/pause controls
  - Mute toggle
  - Fullscreen support
- [ ] Verify favicon and apple-touch-icon display correctly

### Performance & Loading States
- [ ] Check React Query loading states display properly
- [ ] Verify inline loading indicators for mutations (button spinners)
- [ ] Test that only relevant controls disable during operations
- [ ] Confirm no unnecessary full-page reloads
- [ ] Check 10-second polling for payment status updates works

### Error Handling
- [ ] Test network error scenarios
- [ ] Verify backend authorization errors display user-friendly messages
- [ ] Check form validation errors display correctly
- [ ] Test error boundaries catch unexpected errors

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Critical Issues Protocol

**CONSTRAINT: Do not modify any source code unless a blocking production issue is discovered during verification.**

If a blocking issue is found:
1. **Document the Issue**
   - Exact steps to reproduce
   - Expected behavior vs. actual behavior
   - Browser/device information
   - Console errors or network failures
   - Screenshots/recordings if applicable

2. **Assess Severity**
   - **Blocking**: Prevents core functionality (login, role selection, dashboard access)
   - **Critical**: Major feature broken but workarounds exist
   - **Minor**: UI glitch or non-essential feature issue

3. **Minimal Fix Scope**
   - Identify the smallest possible code change to resolve the blocking issue
   - Document the specific files and lines that need modification
   - Ensure fix does not introduce new features or refactoring
   - Test fix in isolation before deploying

4. **Re-verification**
   - After fix is deployed, re-run this entire checklist
   - Confirm the issue is resolved
   - Verify no regressions were introduced

## Sign-Off

- [ ] All verification steps completed successfully
- [ ] No blocking issues discovered, OR blocking issues documented and fixed
- [ ] Production URL accessible and functional
- [ ] Ready for user traffic

**Verified By:** _________________  
**Date:** _________________  
**Version:** Draft 29 → Production  
**Notes:** _________________

---

## Production URLs to Test
- Landing Page: `https://[canister-id].icp0.io/`
- Client Dashboard: `https://[canister-id].icp0.io/client-dashboard`
- Driver Dashboard: `https://[canister-id].icp0.io/driver-dashboard`
- Admin Dashboard: `https://[canister-id].icp0.io/admin-dashboard`
- Payment Success: `https://[canister-id].icp0.io/payment-success`
- Payment Failure: `https://[canister-id].icp0.io/payment-failure`

## Additional Notes
- This checklist focuses exclusively on frontend verification
- Backend functionality is assumed to be stable and deployed
- All routes are defined in `frontend/src/App.tsx` using TanStack Router
- Role-based access control is enforced at both frontend and backend levels
- Internet Identity is the sole authentication method
