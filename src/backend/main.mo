import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";


import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";

// Apply migration using the designated data migration function in migration.mo

actor {
  type Coordinates = {
    latitude : Float;
    longitude : Float;
  };

  public type AppRole = { #customer; #driver };
  public type UserProfile = {
    name : Text;
    userId : Principal;
    phoneNumber : Text;
    userCoordinates : Coordinates;
    isDriver : Bool;
    profileImage : ?Storage.ExternalBlob;
    appRole : AppRole;
  };
  public type DriverProfile = {
    name : Text;
    driverId : Principal;
    carNumber : Text;
    driverCoordinates : Coordinates;
    photo : ?Storage.ExternalBlob;
    stripeAccountId : ?Text;
  };

  public type GeneralVehicleTag = {
    vehicleId : Nat;
    carNumber : Text;
    driverId : Nat;
    firingRange : Nat;
  };
  public type TripStatus = { #pending; #accepted; #inProgress; #completed; #cancelled };

  public type Trip = {
    tripId : Nat;
    clientId : Principal;
    driverId : ?Principal;
    startLocation : Coordinates;
    endLocation : ?Coordinates;
    startTime : Int;
    endTime : ?Int;
    tripStatus : TripStatus;
    distance : ?Float;
    duration : ?Float;
    totalCost : ?Float;
    depositPaid : Bool;
    tripCostCalculation : ?TripCostCalculation;
    statusUpdate : ?StatusUpdate;
    paymentStatus : PaymentStatus;
    locationDetails : LocationDetails;
    specialRequests : Text;
    translatorNeeded : Bool;
    helpLoadingItems : ?Bool;
  };

  public type LocationDetails = {
    pickupAddress : ?Text;
    pickupCoordinates : ?Coordinates;
    dropoffAddress : ?Text;
    dropoffCoordinates : ?Coordinates;
  };

  public type TripCostCalculation = {
    baseCost : Float;
    mileageCost : Float;
    durationCost : Float;
    totalCost : Float;
    deposit : Float;
    companyCommission : Float;
  };

  public type PaymentBreakdown = {
    hourlyPay : Float;
    mileagePay : Float;
    taxDeduction : Float;
    commissionDeduction : Float;
    totalPay : Float;
    companyCommission : Float;
    depositShare : Float;
  };

  public type Status = {
    #tripSuccess : { tripId : Nat };
    #tripFailed : { reason : Text };
  };

  public type StatusUpdate = {
    #tripAccepted : { message : Text };
    #enRoute : { message : Text };
    #arrived : { message : Text };
    #waiting : { message : Text };
    #cancelled : { reason : Text };
    #inProgress : { message : Text };
    #completed : { summary : CostSummary };
  };

  public type CostSummary = {
    total : Float;
    details : Text;
  };

  public type PickupLocation = {
    address : Text;
    coordinates : Coordinates;
  };

  public type LatLng = {
    lat : Float;
    lng : Float;
    timestamp : Int;
  };

  public type PaymentStatus = { #pending; #paid; #transferred };

  public type DriverEarnings = {
    driverId : Principal;
    totalJobs : Nat;
    totalHours : Float;
    totalMileage : Float;
    totalEarnings : Float;
    paymentBreakdown : [PaymentBreakdown];
  };

  public type CompanyEarnings = {
    totalCommission : Float;
    totalDeposits : Float;
    totalCompanyEarnings : Float;
  };

  public type VideoMetadata = {
    title : Text;
    description : Text;
    filePath : Text;
    videoType : VideoType;
  };

  public type VideoType = { #clientInstructional; #driverInstructional };

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Maintain persistent state for trips
  let trips = Map.empty<Nat, Trip>();
  let vehicles = Map.empty<Nat, GeneralVehicleTag>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let drivers = Map.empty<Principal, DriverProfile>();
  let driverPhotos = Map.empty<Principal, Storage.ExternalBlob>();
  let driverEarnings = Map.empty<Principal, DriverEarnings>();
  let videoMetadata = Map.empty<Text, VideoMetadata>();

  // New persistent fields for trip details
  var helpLoadingItems = Map.empty<Nat, ?Bool>();
  var locationDetails = Map.empty<Nat, LocationDetails>();
  var translatorNeeded = Map.empty<Nat, Bool>();
  var tripSpecialRequests = Map.empty<Nat, Text>();

  var configuration : ?Stripe.StripeConfiguration = null;

  ////////////////////////////////////////
  // Roles & Authorization Checks
  ////////////////////////////////////////
  func isCustomer(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.appRole == #customer };
      case (null) { false };
    };
  };

  func isDriver(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.appRole == #driver };
      case (null) { false };
    };
  };

  func isApprovedDriver(caller : Principal) : Bool {
    isDriver(caller) and UserApproval.isApproved(approvalState, caller);
  };

  ////////////////////////////////////////
  // Stripe Integration
  ////////////////////////////////////////
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func createDepositCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can create deposit checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func createFinalPaymentCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can create final payment checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  ////////////////////////////////////////
  // Profiles & Drivers
  ////////////////////////////////////////
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    if (profile.appRole == #driver and not UserApproval.isApproved(approvalState, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      let updatedProfile = { profile with isDriver = false; appRole = #customer };
      userProfiles.add(caller, updatedProfile);
    } else {
      userProfiles.add(caller, profile);
    };
  };

  public shared ({ caller }) func saveProfileImage(userId : Principal, image : Storage.ExternalBlob) : async () {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own profile image");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile images");
    };

    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?userProfile) {
        let updatedProfile = { userProfile with profileImage = ?image };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  ////////////////////////////////////////
  // Driver Stripe Account Management
  ////////////////////////////////////////
  public shared ({ caller }) func createDriverStripeAccountId(stripeAccountId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can connect Stripe accounts");
    };
    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can connect Stripe accounts");
    };
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved drivers can connect Stripe accounts");
    };

    let existingProfile = drivers.get(caller);

    switch (existingProfile) {
      case (null) {
        Runtime.trap("Driver profile must be created before connecting Stripe account");
      };
      case (?profile) {
        let updatedProfile = { profile with stripeAccountId = ?stripeAccountId };
        drivers.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func disconnectDriverStripeAccount() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can disconnect Stripe accounts");
    };
    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can disconnect Stripe accounts");
    };
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved drivers can disconnect Stripe accounts");
    };

    switch (drivers.get(caller)) {
      case (null) {
        Runtime.trap("No associated driver profile found");
      };
      case (?profile) {
        let updatedProfile : DriverProfile = { profile with stripeAccountId = null };
        drivers.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func saveDriverProfile(profile : DriverProfile) : async () {
    if (caller != profile.driverId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only save your own driver profile");
    };
    if (not isDriver(profile.driverId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can save driver profiles");
    };
    if (not AccessControl.isAdmin(accessControlState, caller) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved drivers can save driver profiles");
    };

    drivers.add(profile.driverId, profile);
  };

  public query ({ caller }) func getCallerDriverProfile() : async ?DriverProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access driver profiles");
    };
    if (not isDriver(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can access driver profiles");
    };
    drivers.get(caller);
  };

  public shared ({ caller }) func uploadDriverPhoto(photo : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload photos");
    };
    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can upload photos");
    };
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved drivers can upload photos");
    };

    switch (drivers.get(caller)) {
      case (?driverProfile) {
        driverPhotos.add(caller, photo);
        let updatedProfile = { driverProfile with photo = ?photo };
        drivers.add(caller, updatedProfile);
        photo;
      };
      case (null) {
        Runtime.trap("Unauthorized: Driver profile not found. Create a driver profile first.");
      };
    };
  };

  public query func getDriverPhoto(driverId : Principal) : async ?Storage.ExternalBlob {
    driverPhotos.get(driverId);
  };

  public query func getAllDrivers() : async [DriverProfile] {
    drivers.values().toArray().filter(func(driver) {
      UserApproval.isApproved(approvalState, driver.driverId);
    });
  };

  public query func getDriver(driverId : Principal) : async ?DriverProfile {
    drivers.get(driverId);
  };

  public query func getAllDriverProfilesWithPhotos() : async [(DriverProfile, ?Storage.ExternalBlob)] {
    drivers.keys().toArray().filter(func(driverId) {
      UserApproval.isApproved(approvalState, driverId);
    }).map(func(driverId) {
      switch (drivers.get(driverId)) {
        case (?profile) { (profile, driverPhotos.get(driverId)) };
        case (null) { Runtime.trap("Driver profile data inconsistency") };
      };
    });
  };

  ////////////////////////////////////////
  // Trip Management
  ////////////////////////////////////////
  public shared ({ caller }) func createTrip(trip : Trip) : async Nat {
    // Authorization: Only authenticated users can create trips
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create trips");
    };

    // Authorization: Only customers can create trips (unless admin)
    if (not isCustomer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only customers can create trips");
    };

    // Authorization: Non-admins can only create trips for themselves
    if (caller != trip.clientId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create trips for yourself");
    };

    // Authorization: Verify selected driver is approved
    switch (trip.driverId) {
      case (?driverId) {
        if (not UserApproval.isApproved(approvalState, driverId)) {
          Runtime.trap("Selected driver is not approved");
        };
      };
      case (null) {};
    };

    let tripId = trip.tripId;
    trips.add(tripId, trip);
    tripId;
  };

  public query ({ caller }) func getTrip(tripId : Nat) : async ?Trip {
    switch (trips.get(tripId)) {
      case (?trip) {
        let isClient = caller == trip.clientId;
        let isDriver = switch (trip.driverId) {
          case (?dId) { caller == dId };
          case (null) { false };
        };
        // Authorization: Only trip participants or admins can view trip details
        if (not (isClient or isDriver) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own trips");
        };
        ?trip;
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getClientTrips() : async [Trip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trips");
    };
    if (not isCustomer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only customers can view client trips");
    };
    let clientTrips = trips.values().toArray().filter(func(trip) { trip.clientId == caller });
    clientTrips;
  };

  public query ({ caller }) func getDriverTrips() : async [Trip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trips");
    };
    if (not isDriver(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can view driver trips");
    };
    if (not AccessControl.isAdmin(accessControlState, caller) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved drivers can view driver trips");
    };
    let driverTrips = trips.values().toArray().filter(func(trip) {
      switch (trip.driverId) {
        case (?dId) { dId == caller };
        case (null) { false };
      };
    });
    driverTrips;
  };

  func getTripSync(tripId : Nat) : Trip {
    switch (trips.get(tripId)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?trip) { trip };
    };
  };

  // Authorization: Only admins can update payment status (typically after payment verification)
  public shared ({ caller }) func updateTripPaymentStatus(tripId : Nat, newStatus : PaymentStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };

    let trip = getTripSync(tripId);
    let updatedTrip = { trip with paymentStatus = newStatus };
    trips.add(tripId, updatedTrip);
  };

  // New function: Update trip status with proper authorization
  public shared ({ caller }) func updateTripStatus(tripId : Nat, newStatus : TripStatus, statusUpdate : ?StatusUpdate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trip status");
    };

    let trip = getTripSync(tripId);

    let isClient = caller == trip.clientId;
    let isDriver = switch (trip.driverId) {
      case (?driverId) { caller == driverId };
      case (null) { false };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    // Authorization: Only trip participants or admins can update status
    if (not (isClient or isDriver or isAdmin)) {
      Runtime.trap("Unauthorized: Can only update status for your own trips");
    };

    // Authorization: Customers can only cancel pending trips
    if (isClient and not isAdmin) {
      if (newStatus != #cancelled or trip.tripStatus != #pending) {
        Runtime.trap("Unauthorized: Customers can only cancel pending trips");
      };
    };

    // Authorization: Drivers can accept, start, and complete trips
    if (isDriver and not isAdmin) {
      if (not UserApproval.isApproved(approvalState, caller)) {
        Runtime.trap("Unauthorized: Only approved drivers can update trip status");
      };

      // Drivers cannot cancel trips (only customers can)
      if (newStatus == #cancelled) {
        Runtime.trap("Unauthorized: Drivers cannot cancel trips");
      };
    };

    let updatedTrip = {
      trip with
      tripStatus = newStatus;
      statusUpdate = statusUpdate;
    };
    trips.add(tripId, updatedTrip);
  };

  // New function: Update help loading items (driver completing shopping trip)
  public shared ({ caller }) func updateHelpLoadingItems(tripId : Nat, helpLoading : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trip details");
    };

    let trip = getTripSync(tripId);

    // Authorization: Only the assigned driver or admin can update this field
    let isAssignedDriver = switch (trip.driverId) {
      case (?driverId) { caller == driverId };
      case (null) { false };
    };

    if (not isAssignedDriver and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the assigned driver can update help loading items");
    };

    // Authorization: Driver must be approved
    if (not AccessControl.isAdmin(accessControlState, caller) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved drivers can update trip details");
    };

    let updatedTrip = { trip with helpLoadingItems = ?helpLoading };
    trips.add(tripId, updatedTrip);
  };

  ////////////////////////////////////////
  // Earnings Management
  ////////////////////////////////////////
  public query ({ caller }) func getCompanyEarnings() : async CompanyEarnings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view company earnings");
    };

    var totalCommission : Float = 0;
    var totalDeposits : Float = 0;

    for (trip in trips.values()) {
      switch (trip.tripCostCalculation) {
        case (?cost) {
          totalCommission += cost.companyCommission;
          totalDeposits += cost.deposit;
        };
        case (null) {};
      };
    };

    let totalCompanyEarnings = totalCommission + totalDeposits;

    {
      totalCommission;
      totalDeposits;
      totalCompanyEarnings;
    };
  };

  public shared ({ caller }) func addVehicle(vehicle : GeneralVehicleTag) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add vehicles");
    };
    vehicles.add(vehicle.vehicleId, vehicle);
  };

  public shared ({ caller }) func updateDriverEarnings(driverId : Principal, paymentBreakdown : PaymentBreakdown) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update driver earnings");
    };

    var totalJobs : Nat = 0;
    var totalHours : Float = 0;
    var totalMileage : Float = 0;
    var totalEarnings : Float = 0;

    let existingPaymentBreakdown : [PaymentBreakdown] = [paymentBreakdown];

    let existingEarnings : DriverEarnings = {
      driverId;
      totalJobs = 0;
      totalHours = 0;
      totalMileage = 0;
      totalEarnings = 0;
      paymentBreakdown = existingPaymentBreakdown;
    };

    let newEarnings : DriverEarnings = {
      driverId;
      totalJobs;
      totalHours;
      totalMileage;
      totalEarnings;
      paymentBreakdown = existingPaymentBreakdown;
    };
    driverEarnings.add(driverId, newEarnings);
  };

  public query ({ caller }) func getDriverEarnings(driverId : Principal) : async ?DriverEarnings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings");
    };
    if (caller != driverId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own earnings");
    };
    if (not isDriver(driverId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can view driver earnings");
    };
    driverEarnings.get(driverId);
  };

  public query ({ caller }) func getAllDriverEarnings() : async [DriverEarnings] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all driver earnings");
    };
    driverEarnings.values().toArray();
  };

  public shared ({ caller }) func updatePaymentBreakdown(driverId : Principal, newPaymentBreakdown : PaymentBreakdown) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update payment breakdowns");
    };

    switch (driverEarnings.get(driverId)) {
      case (null) { Runtime.trap("Driver earnings not found") };
      case (?existingEarnings) {
        let updatedPaymentBreakdown = [newPaymentBreakdown];
        let updatedEarnings : DriverEarnings = {
          existingEarnings with paymentBreakdown = updatedPaymentBreakdown;
        };
        driverEarnings.add(driverId, updatedEarnings);
      };
    };
  };

  public query ({ caller }) func getTotalCompletedJobs(driverId : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view job statistics");
    };
    if (caller != driverId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own job statistics");
    };
    if (not isDriver(driverId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can view job statistics");
    };
    let driverTrips = trips.values().toArray().filter(func(trip) {
      switch (trip.driverId) {
        case (?dId) { dId == driverId and trip.tripStatus == #completed };
        case (null) { false };
      }
    });
    driverTrips.size();
  };

  public query ({ caller }) func calculateTotalEarnings(driverId : Principal) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings");
    };
    if (caller != driverId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own earnings");
    };
    if (not isDriver(driverId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can view earnings");
    };
    var total : Float = 0;
    let driverTrips = trips.values().toArray().filter(func(trip) {
      switch (trip.driverId) {
        case (?dId) { dId == driverId and trip.tripStatus == #completed };
        case (null) { false };
      }
    });
    for (trip in driverTrips.values()) {
      switch (trip.totalCost) {
        case (?cost) { total += cost };
        case (null) {};
      };
    };
    total;
  };

  public query ({ caller }) func calculateTotalDistance(driverId : Principal) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view distance statistics");
    };
    if (caller != driverId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own distance statistics");
    };
    if (not isDriver(driverId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only drivers can view distance statistics");
    };
    var total : Float = 0;
    let driverTrips = trips.values().toArray().filter(func(trip) {
      switch (trip.driverId) {
        case (?dId) { dId == driverId and trip.tripStatus == #completed };
        case (null) { false };
      }
    });
    for (trip in driverTrips.values()) {
      switch (trip.distance) {
        case (?distance) { total += distance };
        case (null) {};
      };
    };
    total;
  };

  ////////////////////////////////////////
  // Video Metadata
  ////////////////////////////////////////
  public shared ({ caller }) func uploadVideoMetadata(metadata : VideoMetadata) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload video metadata");
    };
    videoMetadata.add(metadata.title, metadata);
  };

  public query ({ caller }) func getVideoMetadata(title : Text) : async ?VideoMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view video metadata");
    };
    videoMetadata.get(title);
  };

  public query ({ caller }) func getAllVideoMetadata() : async [VideoMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view video metadata");
    };
    videoMetadata.values().toArray();
  };

  public query ({ caller }) func getVideosByType(videoType : VideoType) : async [VideoMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };

    switch (videoType) {
      case (#clientInstructional) {
        if (not isCustomer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only customers can view client instructional videos");
        };
      };
      case (#driverInstructional) {
        if (not isDriver(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only drivers can view driver instructional videos");
        };
      };
    };

    videoMetadata.values().toArray().filter(func(metadata) {
      metadata.videoType == videoType;
    });
  };

  ////////////////////////////////////////
  // Approval Logic
  ////////////////////////////////////////
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request approval");
    };
    if (not isDriver(caller)) {
      Runtime.trap("Unauthorized: Only drivers can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };
};

