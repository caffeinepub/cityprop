import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type Coordinates = {
    latitude : Float;
    longitude : Float;
  };

  type CostSummary = {
    total : Float;
    details : Text;
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

  type TripStatus = { #pending; #accepted; #inProgress; #completed; #cancelled };
  type PaymentStatus = { #pending; #paid; #transferred };

  type OldTrip = {
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
  };

  type OldActor = { trips : Map.Map<Nat, OldTrip> };
  type NewActor = { trips : Map.Map<Nat, NewTrip> };

  public func run(old : OldActor) : NewActor {
    let trips = old.trips.map<Nat, OldTrip, NewTrip>(
      func(_id, oldTrip) {
        {
          oldTrip with
          distance = switch (oldTrip.distance) {
            case (null) { 0.0 };
            case (?value) { value };
          };
        };
      }
    );
    { trips };
  };
};
