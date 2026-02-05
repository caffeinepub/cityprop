import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, ShoppingItem, DriverProfile, ExternalBlob, ApprovalStatus, UserApprovalInfo, DriverEarnings, CompanyEarnings, Trip, PaymentStatus, TripStatus, StatusUpdate } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerDriverProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<DriverProfile | null>({
    queryKey: ['currentDriverProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerDriverProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveDriverProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: DriverProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveDriverProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentDriverProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
    },
  });
}

export function useUploadDriverPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadDriverPhoto(photo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentDriverProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
    },
  });
}

export function useGetAllDrivers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DriverProfile[]>({
    queryKey: ['allDrivers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDrivers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetDriverTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['driverTrips'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDriverTrips();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useGetClientTrips() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip[]>({
    queryKey: ['clientTrips'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClientTrips();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useGetTrip(tripId?: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Trip | null>({
    queryKey: ['trip', tripId?.toString()],
    queryFn: async () => {
      if (!actor || !tripId) return null;
      return actor.getTrip(tripId);
    },
    enabled: !!actor && !actorFetching && !!tripId,
  });
}

export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: Trip) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTrip(trip);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTrips'] });
      queryClient.invalidateQueries({ queryKey: ['driverTrips'] });
    },
  });
}

export function useUpdateTripStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: bigint; newStatus: TripStatus; statusUpdate: StatusUpdate | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTripStatus(params.tripId, params.newStatus, params.statusUpdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverTrips'] });
      queryClient.invalidateQueries({ queryKey: ['clientTrips'] });
      queryClient.invalidateQueries({ queryKey: ['trip'] });
    },
  });
}

export function useUpdateHelpLoadingItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: bigint; helpLoading: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHelpLoadingItems(params.tripId, params.helpLoading);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverTrips'] });
      queryClient.invalidateQueries({ queryKey: ['clientTrips'] });
      queryClient.invalidateQueries({ queryKey: ['trip'] });
    },
  });
}

export function useUpdateTripMiles() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: bigint; miles: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTripMiles(params.tripId, params.miles);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverTrips'] });
      queryClient.invalidateQueries({ queryKey: ['clientTrips'] });
      queryClient.invalidateQueries({ queryKey: ['trip'] });
    },
  });
}

export function useGetDriverEarnings(driverId?: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DriverEarnings | null>({
    queryKey: ['driverEarnings', driverId?.toString()],
    queryFn: async () => {
      if (!actor || !driverId) return null;
      return actor.getDriverEarnings(driverId);
    },
    enabled: !!actor && !actorFetching && !!driverId,
    refetchInterval: 10000,
  });
}

export function useGetCompanyEarnings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CompanyEarnings>({
    queryKey: ['companyEarnings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCompanyEarnings();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useUpdateTripPaymentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: bigint; newStatus: PaymentStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTripPaymentStatus(params.tripId, params.newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverTrips'] });
      queryClient.invalidateQueries({ queryKey: ['clientTrips'] });
      queryClient.invalidateQueries({ queryKey: ['driverEarnings'] });
      queryClient.invalidateQueries({ queryKey: ['companyEarnings'] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(params.items, params.successUrl, params.cancelUrl);
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useCreateDepositCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createDepositCheckoutSession(params.items, params.successUrl, params.cancelUrl);
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useCreateFinalPaymentCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createFinalPaymentCheckoutSession(params.items, params.successUrl, params.cancelUrl);
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: { secretKey: string; allowedCountries: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvalsList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(params.user, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalsList'] });
    },
  });
}
