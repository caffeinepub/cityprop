import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Trip {
    startTime: bigint;
    miles?: number;
    driverId?: Principal;
    duration?: number;
    clientId: Principal;
    paymentStatus: PaymentStatus;
    endTime?: bigint;
    specialRequests: string;
    tripId: bigint;
    totalCost?: number;
    distance: number;
    translatorNeeded: boolean;
    endLocation?: Coordinates;
    helpLoadingItems?: boolean;
    tripCostCalculation?: TripCostCalculation;
    startLocation: Coordinates;
    locationDetails: LocationDetails;
    statusUpdate?: StatusUpdate;
    tripStatus: TripStatus;
    depositPaid: boolean;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export type StatusUpdate = {
    __kind__: "cancelled";
    cancelled: {
        reason: string;
    };
} | {
    __kind__: "arrived";
    arrived: {
        message: string;
    };
} | {
    __kind__: "completed";
    completed: {
        summary: CostSummary;
    };
} | {
    __kind__: "waiting";
    waiting: {
        message: string;
    };
} | {
    __kind__: "inProgress";
    inProgress: {
        message: string;
    };
} | {
    __kind__: "enRoute";
    enRoute: {
        message: string;
    };
} | {
    __kind__: "tripAccepted";
    tripAccepted: {
        message: string;
    };
};
export interface DriverProfile {
    driverId: Principal;
    stripeAccountId?: string;
    name: string;
    driverCoordinates: Coordinates;
    carNumber: string;
    photo?: ExternalBlob;
}
export interface CompanyEarnings {
    totalCommission: number;
    totalDeposits: number;
    totalCompanyEarnings: number;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PaymentBreakdown {
    mileagePay: number;
    depositShare: number;
    totalPay: number;
    companyCommission: number;
    hourlyPay: number;
    taxDeduction: number;
    commissionDeduction: number;
}
export interface CostSummary {
    total: number;
    details: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface TripCostCalculation {
    durationCost: number;
    totalCost: number;
    deposit: number;
    companyCommission: number;
    mileageCost: number;
    baseCost: number;
}
export interface DriverEarnings {
    driverId: Principal;
    totalHours: number;
    totalJobs: bigint;
    paymentBreakdown: Array<PaymentBreakdown>;
    totalEarnings: number;
    totalMileage: number;
}
export interface LocationDetails {
    dropoffCoordinates?: Coordinates;
    pickupCoordinates?: Coordinates;
    pickupAddress?: string;
    dropoffAddress?: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface GeneralVehicleTag {
    driverId: bigint;
    firingRange: bigint;
    carNumber: string;
    vehicleId: bigint;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface VideoMetadata {
    title: string;
    description: string;
    filePath: string;
    videoType: VideoType;
}
export interface UserProfile {
    userCoordinates: Coordinates;
    appRole: AppRole;
    isDriver: boolean;
    userId: Principal;
    profileImage?: ExternalBlob;
    name: string;
    phoneNumber: string;
}
export enum AppRole {
    customer = "customer",
    driver = "driver"
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    transferred = "transferred"
}
export enum TripStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    accepted = "accepted",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VideoType {
    driverInstructional = "driverInstructional",
    clientInstructional = "clientInstructional"
}
export interface backendInterface {
    addVehicle(vehicle: GeneralVehicleTag): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateTotalDistance(driverId: Principal): Promise<number>;
    calculateTotalEarnings(driverId: Principal): Promise<number>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createDepositCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createDriverStripeAccountId(stripeAccountId: string): Promise<void>;
    createFinalPaymentCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createTrip(trip: Trip): Promise<bigint>;
    disconnectDriverStripeAccount(): Promise<void>;
    getAllDriverEarnings(): Promise<Array<DriverEarnings>>;
    getAllDriverProfilesWithPhotos(): Promise<Array<[DriverProfile, ExternalBlob | null]>>;
    getAllDrivers(): Promise<Array<DriverProfile>>;
    getAllVideoMetadata(): Promise<Array<VideoMetadata>>;
    getCallerDriverProfile(): Promise<DriverProfile | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClientTrips(): Promise<Array<Trip>>;
    getCompanyEarnings(): Promise<CompanyEarnings>;
    getDriver(driverId: Principal): Promise<DriverProfile | null>;
    getDriverEarnings(driverId: Principal): Promise<DriverEarnings | null>;
    getDriverPhoto(driverId: Principal): Promise<ExternalBlob | null>;
    getDriverTrips(): Promise<Array<Trip>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTotalCompletedJobs(driverId: Principal): Promise<bigint>;
    getTrip(tripId: bigint): Promise<Trip | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideoMetadata(title: string): Promise<VideoMetadata | null>;
    getVideosByType(videoType: VideoType): Promise<Array<VideoMetadata>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDriverProfile(profile: DriverProfile): Promise<void>;
    saveProfileImage(userId: Principal, image: ExternalBlob): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateDriverEarnings(driverId: Principal, paymentBreakdown: PaymentBreakdown): Promise<void>;
    updateHelpLoadingItems(tripId: bigint, helpLoading: boolean): Promise<void>;
    updatePaymentBreakdown(driverId: Principal, newPaymentBreakdown: PaymentBreakdown): Promise<void>;
    updateTripMiles(tripId: bigint, miles: number): Promise<void>;
    updateTripPaymentStatus(tripId: bigint, newStatus: PaymentStatus): Promise<void>;
    updateTripStatus(tripId: bigint, newStatus: TripStatus, statusUpdate: StatusUpdate | null): Promise<void>;
    uploadDriverPhoto(photo: ExternalBlob): Promise<ExternalBlob>;
    uploadVideoMetadata(metadata: VideoMetadata): Promise<void>;
}
