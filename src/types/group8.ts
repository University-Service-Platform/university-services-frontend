/**
 * Group 8 - Events, Communications & Feedback domain types
 *
 * Mirrors the Group 8 BA Requirements Report (section 9 "Data / Information
 * Required") and the draft OpenAPI contracts for:
 *   - event-service                  (Event, EligibilityRule, Registration)
 *   - communication-feedback-service (Announcement, AudienceRule, Notification,
 *                                     FeedbackForm, FeedbackResponse)
 *
 * GROUP 8 DRAFT CONTRACT: field names follow the agreed Group 8 draft and must be
 * kept in sync with the backend Swagger once the services are deployed.
 */

import type { UserRole } from './index';

/* ------------------------------------------------------------------ */
/* Events (event-service)                                              */
/* ------------------------------------------------------------------ */

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type EventMode = 'PHYSICAL' | 'ONLINE';

/** Who may register. Empty arrays mean "no restriction" on that dimension. */
export interface EligibilityRule {
  roles: UserRole[];
  facultyIds: string[];
  departmentIds: string[];
}

export interface UniversityEvent {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  mode: EventMode;
  /** Group 6 facility/resource ID when mode is PHYSICAL. */
  venueResourceId?: string;
  venueName?: string;
  /** Meeting link when mode is ONLINE. */
  onlineLink?: string;
  startTime: string;
  endTime: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  capacity: number;
  confirmedCount: number;
  eligibility: EligibilityRule;
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventUpsertRequest {
  title: string;
  description: string;
  mode: EventMode;
  venueResourceId?: string;
  onlineLink?: string;
  startTime: string;
  endTime: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  capacity: number;
  eligibility: EligibilityRule;
}

/** Response of the Group 6 venue check proxied through event-service. */
export interface VenueValidationResult {
  valid: boolean;
  venueName?: string;
  capacity?: number;
  reason?: string;
}

/* ------------------------------------------------------------------ */
/* Registrations (event-service)                                       */
/* ------------------------------------------------------------------ */

export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartTime: string;
  eventStatus: EventStatus;
  registrationClosesAt: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt?: string;
}

export interface RegistrationSummary {
  eventId: string;
  capacity: number;
  confirmed: number;
  waitlisted: number;
  cancelled: number;
  registrants: Array<{
    registrationId: string;
    userId: string;
    displayName: string;
    departmentName?: string;
    status: RegistrationStatus;
    registeredAt: string;
  }>;
}

/* ------------------------------------------------------------------ */
/* Announcements (communication-feedback-service)                     */
/* ------------------------------------------------------------------ */

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AudienceType = 'ALL' | 'ROLE' | 'FACULTY' | 'DEPARTMENT' | 'SERVICE_UNIT';

export interface AudienceRule {
  type: AudienceType;
  /** Role names or directory IDs from Group 5, depending on `type`. Empty for ALL. */
  values: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: AudienceRule;
  publisherId: string;
  publisherName: string;
  status: AnnouncementStatus;
  publishedAt?: string;
  createdAt: string;
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  audience: AudienceRule;
  publishNow: boolean;
}

export interface AudiencePreview {
  estimatedRecipients: number;
  description: string;
}

/* ------------------------------------------------------------------ */
/* Notifications (communication-feedback-service)                     */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | 'REGISTRATION_CONFIRMED'
  | 'REGISTRATION_CANCELLED'
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'RESERVATION_STATUS'
  | 'SERVICE_REQUEST_STATUS'
  | 'FEEDBACK_REQUESTED';

export type NotificationSource = 'GROUP8_EVENTS' | 'GROUP8_COMMS' | 'GROUP6' | 'GROUP7';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  source: NotificationSource;
  /** Related event / announcement / request ID for deep links. */
  referenceId?: string;
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Feedback (communication-feedback-service)                          */
/* ------------------------------------------------------------------ */

export type ActivityType = 'EVENT' | 'SERVICE_REQUEST';
export type FeedbackQuestionType = 'RATING' | 'TEXT' | 'YES_NO';

export interface FeedbackQuestion {
  id: string;
  label: string;
  type: FeedbackQuestionType;
  required: boolean;
}

export interface FeedbackForm {
  id: string;
  activityType: ActivityType;
  title: string;
  questions: FeedbackQuestion[];
}

/**
 * An activity the current user attended/requested. `eligible` is decided by
 * the backend (event COMPLETED, or Group 7 status RESOLVED/CLOSED and the
 * requester is the current user) - the UI only displays the result.
 */
export interface FeedbackActivity {
  activityType: ActivityType;
  activityId: string;
  title: string;
  completedAt?: string;
  /** Raw status reported by the owner service (e.g. Group 7 CLOSED). */
  sourceStatus: string;
  eligible: boolean;
  ineligibleReason?: string;
  alreadySubmitted: boolean;
}

export interface FeedbackAnswer {
  questionId: string;
  rating?: number;
  text?: string;
  yesNo?: boolean;
}

export interface FeedbackSubmitRequest {
  activityType: ActivityType;
  activityId: string;
  formId: string;
  answers: FeedbackAnswer[];
}

export interface FeedbackSummary {
  activityType: ActivityType;
  activityId: string;
  title: string;
  responseCount: number;
  averageRating: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  recentComments: string[];
}

/* ------------------------------------------------------------------ */
/* Engagement dashboard                                               */
/* ------------------------------------------------------------------ */

export interface EngagementSummary {
  totals: {
    publishedEvents: number;
    activeRegistrations: number;
    announcementsPublished: number;
    feedbackResponses: number;
    averageRating: number;
  };
  eventParticipation: Array<{
    eventId: string;
    title: string;
    capacity: number;
    confirmed: number;
  }>;
  announcementReach: Array<{
    announcementId: string;
    title: string;
    audienceLabel: string;
    recipients: number;
    readCount: number;
  }>;
}
