import { TripStatus, StatusUpdate } from '../backend';

export type TripStep = 
  | 'pending'
  | 'accepted'
  | 'enRoute'
  | 'arrived'
  | 'inProgress'
  | 'completed'
  | 'cancelled';

export interface TripProgressInfo {
  currentStep: TripStep;
  stepLabel: string;
  nextAction?: DriverAction;
  latestMessage?: string;
  completionSummary?: {
    total: number;
    details: string;
  };
}

export interface DriverAction {
  action: 'accept' | 'enRoute' | 'arrived' | 'inProgress' | 'complete';
  label: string;
  requiresMessage: boolean;
  requiresSummary: boolean;
}

/**
 * Maps trip status and status update to a current step and determines next action
 */
export function getTripProgress(
  tripStatus: TripStatus,
  statusUpdate?: StatusUpdate | null
): TripProgressInfo {
  // Handle cancelled trips
  if (tripStatus === TripStatus.cancelled) {
    const message = statusUpdate?.__kind__ === 'cancelled' 
      ? statusUpdate.cancelled.reason 
      : undefined;
    return {
      currentStep: 'cancelled',
      stepLabel: 'Cancelled',
      latestMessage: message,
    };
  }

  // Handle completed trips
  if (tripStatus === TripStatus.completed) {
    const summary = statusUpdate?.__kind__ === 'completed'
      ? {
          total: statusUpdate.completed.summary.total,
          details: statusUpdate.completed.summary.details,
        }
      : undefined;
    return {
      currentStep: 'completed',
      stepLabel: 'Completed',
      completionSummary: summary,
    };
  }

  // Handle in-progress trips
  if (tripStatus === TripStatus.inProgress) {
    const message = statusUpdate?.__kind__ === 'inProgress'
      ? statusUpdate.inProgress.message
      : undefined;
    return {
      currentStep: 'inProgress',
      stepLabel: 'In Progress',
      latestMessage: message,
      nextAction: {
        action: 'complete',
        label: 'Complete Trip',
        requiresMessage: false,
        requiresSummary: true,
      },
    };
  }

  // Handle accepted trips - determine sub-step from statusUpdate
  if (tripStatus === TripStatus.accepted) {
    if (statusUpdate?.__kind__ === 'arrived') {
      return {
        currentStep: 'arrived',
        stepLabel: 'Arrived at Pickup',
        latestMessage: statusUpdate.arrived.message,
        nextAction: {
          action: 'inProgress',
          label: 'Start Trip',
          requiresMessage: true,
          requiresSummary: false,
        },
      };
    }
    
    if (statusUpdate?.__kind__ === 'enRoute') {
      return {
        currentStep: 'enRoute',
        stepLabel: 'En Route to Pickup',
        latestMessage: statusUpdate.enRoute.message,
        nextAction: {
          action: 'arrived',
          label: 'Mark as Arrived',
          requiresMessage: true,
          requiresSummary: false,
        },
      };
    }

    // Just accepted, no further updates yet
    const message = statusUpdate?.__kind__ === 'tripAccepted'
      ? statusUpdate.tripAccepted.message
      : undefined;
    return {
      currentStep: 'accepted',
      stepLabel: 'Accepted',
      latestMessage: message,
      nextAction: {
        action: 'enRoute',
        label: 'En Route to Pickup',
        requiresMessage: true,
        requiresSummary: false,
      },
    };
  }

  // Handle pending trips
  return {
    currentStep: 'pending',
    stepLabel: 'Pending',
    nextAction: {
      action: 'accept',
      label: 'Accept Trip',
      requiresMessage: true,
      requiresSummary: false,
    },
  };
}

/**
 * Get a user-friendly step label for display
 */
export function getStepDisplayLabel(step: TripStep): string {
  const labels: Record<TripStep, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    enRoute: 'En Route to Pickup',
    arrived: 'Arrived at Pickup',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[step];
}

/**
 * Get the next TripStatus and StatusUpdate for a driver action
 */
export function getNextStatusForAction(
  action: DriverAction['action'],
  message: string,
  summary?: { total: number; details: string }
): { newStatus: TripStatus; statusUpdate: StatusUpdate } {
  switch (action) {
    case 'accept':
      return {
        newStatus: TripStatus.accepted,
        statusUpdate: {
          __kind__: 'tripAccepted',
          tripAccepted: { message },
        },
      };
    case 'enRoute':
      return {
        newStatus: TripStatus.accepted,
        statusUpdate: {
          __kind__: 'enRoute',
          enRoute: { message },
        },
      };
    case 'arrived':
      return {
        newStatus: TripStatus.accepted,
        statusUpdate: {
          __kind__: 'arrived',
          arrived: { message },
        },
      };
    case 'inProgress':
      return {
        newStatus: TripStatus.inProgress,
        statusUpdate: {
          __kind__: 'inProgress',
          inProgress: { message },
        },
      };
    case 'complete':
      if (!summary) {
        throw new Error('Completion summary is required');
      }
      return {
        newStatus: TripStatus.completed,
        statusUpdate: {
          __kind__: 'completed',
          completed: {
            summary: {
              total: summary.total,
              details: summary.details,
            },
          },
        },
      };
  }
}
