import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Principal "mo:core/Principal";

module {
  type Coordinates = {
    latitude : Float;
    longitude : Float;
  };

  type AppRole = { #customer; #driver };

  type UserProfile = {
    name : Text;
    userId : Principal;
    phoneNumber : Text;
    userCoordinates : Coordinates;
    isDriver : Bool;
    profileImage : ?Blob;
    appRole : AppRole;
  };

  type DriverProfile = {
    name : Text;
    driverId : Principal;
    carNumber : Text;
    driverCoordinates : Coordinates;
    photo : ?Blob;
    stripeAccountId : ?Text;
  };

  type GeneralVehicleTag = {
    vehicleId : Nat;
    carNumber : Text;
    driverId : Nat;
    firingRange : Nat;
  };

  type TripStatus = { #pending; #accepted; #inProgress; #completed; #cancelled };

  type LocationDetails = {
    pickupAddress : ?Text;
    pickupCoordinates : ?Coordinates;
    dropoffAddress : ?Text;
    dropoffCoordinates : ?Coordinates;
  };

  type TripCostCalculation = {
    baseCost : Float;
    mileageCost : Float;
    durationCost : Float;
    totalCost : Float;
    deposit : Float;
    companyCommission : Float;
  };

  type PaymentBreakdown = {
    hourlyPay : Float;
    mileagePay : Float;
    taxDeduction : Float;
    commissionDeduction : Float;
    totalPay : Float;
    companyCommission : Float;
    depositShare : Float;
  };

  type Status = {
    #tripSuccess : { tripId : Nat };
    #tripFailed : { reason : Text };
  };

  type StatusUpdate = {
    #tripAccepted : { message : Text };
    #enRoute : { message : Text };
    #arrived : { message : Text };
    #waiting : { message : Text };
    #cancelled : { reason : Text };
    #inProgress : { message : Text };
    #completed : { summary : CostSummary };
  };

  type CostSummary = {
    total : Float;
    details : Text;
  };

  type PickupLocation = {
    address : Text;
    coordinates : Coordinates;
  };

  type LatLng = {
    lat : Float;
    lng : Float;
    timestamp : Int;
  };

  type PaymentStatus = { #pending; #paid; #transferred };

  type DriverEarnings = {
    driverId : Principal;
    totalJobs : Nat;
    totalHours : Float;
    totalMileage : Float;
    totalEarnings : Float;
    paymentBreakdown : [PaymentBreakdown];
  };

  type CompanyEarnings = {
    totalCommission : Float;
    totalDeposits : Float;
    totalCompanyEarnings : Float;
  };

  type VideoMetadata = {
    title : Text;
    description : Text;
    filePath : Text;
    videoType : VideoType;
  };

  type VideoType = { #clientInstructional; #driverInstructional };

  type OldTrip = {
    tripId : Nat;
    clientId : Principal;
    driverId : ?Principal;
    startLocation : Coordinates;
    endLocation : ?Coordinates;
    startTime : Int;
    endTime : ?Int;
    tripStatus : TripStatus;
    distance : Float;
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
    miles : ?Float;
  };

  type NewTrip = {
    tripId : Nat;
    clientId : Principal;
    driverId : ?Principal;
    startLocation : Coordinates;
    endLocation : ?Coordinates;
    startTime : Int;
    endTime : ?Int;
    tripStatus : TripStatus;
    distance : Float;
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
    miles : ?Float;
    declineReason : ?Text;
  };

  type OldActor = {
    trips : Map.Map<Nat, OldTrip>;
    vehicles : Map.Map<Nat, GeneralVehicleTag>;
    userProfiles : Map.Map<Principal, UserProfile>;
    drivers : Map.Map<Principal, DriverProfile>;
    driverPhotos : Map.Map<Principal, Blob>;
    driverEarnings : Map.Map<Principal, DriverEarnings>;
    videoMetadata : Map.Map<Text, VideoMetadata>;
    helpLoadingItems : Map.Map<Nat, ?Bool>;
    locationDetails : Map.Map<Nat, LocationDetails>;
    translatorNeeded : Map.Map<Nat, Bool>;
    tripSpecialRequests : Map.Map<Nat, Text>;
  };

  type NewActor = {
    trips : Map.Map<Nat, NewTrip>;
    vehicles : Map.Map<Nat, GeneralVehicleTag>;
    userProfiles : Map.Map<Principal, UserProfile>;
    drivers : Map.Map<Principal, DriverProfile>;
    driverPhotos : Map.Map<Principal, Blob>;
    driverEarnings : Map.Map<Principal, DriverEarnings>;
    videoMetadata : Map.Map<Text, VideoMetadata>;
    helpLoadingItems : Map.Map<Nat, ?Bool>;
    locationDetails : Map.Map<Nat, LocationDetails>;
    translatorNeeded : Map.Map<Nat, Bool>;
    tripSpecialRequests : Map.Map<Nat, Text>;
  };

  public func run(old : OldActor) : NewActor {
    let newTrips = old.trips.map<Nat, OldTrip, NewTrip>(
      func(_id, oldTrip) {
        // Add default null for `declineReason`.
        { oldTrip with declineReason = null };
      }
    );
    { old with trips = newTrips };
  };
};
