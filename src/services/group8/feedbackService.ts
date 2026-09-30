import { G8_INSIGHT_ROLES } from '@/config/group8Routes';
import type {
  ActivityType,
  EngagementSummary,
  FeedbackActivity,
  FeedbackAnswer,
  FeedbackForm,
  FeedbackQuestion,
  FeedbackSubmitRequest,
  FeedbackSummary,
  UserRole,
} from '@/types';
import { g8Fail, g8Ok, g8Request, g8RequestMapped, getG8DemoIdentity, nextDemoId, type G8Result } from './g8Api';

/**
 * communication-feedback-service client - feedback & engagement (Group 8)
 *
 * Integrated with Notification-and-Feedback-Uni-Service-Management-System_Backend through the
 * API Gateway (`/api/v1`). Feedback is collected per form: organizers open a form for a completed
 * activity, users answer it with one rating (1-5) and an optional comment.
 *
 *   POST  /feedback/forms                       { activityType, activityId, title, questionsJson }
 *   GET   /feedback/forms                       active forms (the Feedback Center lists these)
 *   GET   /feedback/forms/{formId}
 *   POST  /feedback/forms/{formId}/responses    { rating, comment } - eligibility checked server-side
 *   GET   /feedback/forms/{formId}/responses    form creator only (used for summaries)
 *   GET   /engagement-dashboard/summary         counts and average rating
 *
 * Service-request eligibility follows the Group 7 completion-status contract
 * (RESOLVED/CLOSED eligible, REJECTED not) - enforced by the service when a response is submitted.
 */

export const FEEDBACK_API = '/feedback';
export const ENGAGEMENT_API = '/engagement';

/** Roles allowed to view feedback summaries and the engagement dashboard (US8-13). */
export const FEEDBACK_INSIGHT_ROLES: UserRole[] = G8_INSIGHT_ROLES;

/** Group 7 statuses that make a service request eligible for feedback. */
export const G7_FEEDBACK_ELIGIBLE_STATUSES = ['RESOLVED', 'CLOSED'];

/** User-facing explanation of a Group 7 service-request status for feedback purposes. */
export function explainServiceRequestEligibility(status: string): { eligible: boolean; reason?: string } {
  if (G7_FEEDBACK_ELIGIBLE_STATUSES.includes(status)) return { eligible: true };
  if (status === 'REJECTED') {
    return { eligible: false, reason: 'This request was rejected by the service desk, so no service was delivered to review.' };
  }
  if (status === 'CANCELLED') return { eligible: false, reason: 'This request was cancelled.' };
  return {
    eligible: false,
    reason: `Feedback opens once the service desk resolves this request (current status: ${status.replace('_', ' ').toLowerCase()}).`,
  };
}

/* ------------------------------------------------------------------ */
/* Synthetic demo data                                                 */
/* ------------------------------------------------------------------ */

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const serviceActivity = (activityId: string, title: string, sourceStatus: string, completedDays?: number): FeedbackActivity => {
  const { eligible, reason } = explainServiceRequestEligibility(sourceStatus);
  return {
    activityType: 'SERVICE_REQUEST',
    activityId,
    title,
    sourceStatus,
    completedAt: completedDays === undefined ? undefined : daysAgo(completedDays),
    eligible,
    ineligibleReason: reason,
    alreadySubmitted: false,
  };
};

const demoActivities: FeedbackActivity[] = [
  {
    activityType: 'EVENT',
    activityId: 'EVT-1006',
    title: 'Freshers Orientation: Digital Services',
    sourceStatus: 'COMPLETED',
    completedAt: daysAgo(6),
    eligible: true,
    alreadySubmitted: false,
  },
  {
    activityType: 'EVENT',
    activityId: 'EVT-0990',
    title: 'Library Research Skills Workshop',
    sourceStatus: 'COMPLETED',
    completedAt: daysAgo(21),
    eligible: true,
    alreadySubmitted: true,
  },
  {
    activityType: 'EVENT',
    activityId: 'EVT-1001',
    title: 'Innovation Week Workshop',
    sourceStatus: 'PUBLISHED',
    eligible: false,
    ineligibleReason: 'Feedback opens after the event has taken place.',
    alreadySubmitted: false,
  },
  serviceActivity('REQ-2026-004', 'Software license request for MATLAB', 'RESOLVED', 2),
  serviceActivity('REQ-2026-005', 'Replacement of broken desk chair', 'CLOSED', 9),
  serviceActivity('REQ-2026-002', 'Air conditioning repair in Lab 3', 'IN_PROGRESS'),
  serviceActivity('REQ-2026-006', 'Request for custom server access', 'REJECTED'),
];

const EVENT_FORM: FeedbackForm = {
  id: 'FRM-EVENT-STD',
  activityType: 'EVENT',
  title: 'Event feedback',
  questions: [
    { id: 'q-overall', label: 'Overall, how would you rate this event?', type: 'RATING', required: true },
    { id: 'q-content', label: 'How useful was the content?', type: 'RATING', required: true },
    { id: 'q-recommend', label: 'Would you recommend this event to others?', type: 'YES_NO', required: true },
    { id: 'q-comment', label: 'What could we improve?', type: 'TEXT', required: false },
  ],
};

const SERVICE_FORM: FeedbackForm = {
  id: 'FRM-SERVICE-STD',
  activityType: 'SERVICE_REQUEST',
  title: 'Service feedback',
  questions: [
    { id: 'q-overall', label: 'How satisfied are you with how your request was handled?', type: 'RATING', required: true },
    { id: 'q-speed', label: 'How would you rate the response time?', type: 'RATING', required: true },
    { id: 'q-resolved', label: 'Was your problem fully resolved?', type: 'YES_NO', required: true },
    { id: 'q-comment', label: 'Any comments for the service team?', type: 'TEXT', required: false },
  ],
};

const demoSummaries: FeedbackSummary[] = [
  {
    activityType: 'EVENT',
    activityId: 'EVT-1006',
    title: 'Freshers Orientation: Digital Services',
    responseCount: 87,
    averageRating: 4.3,
    ratingDistribution: { '1': 2, '2': 3, '3': 9, '4': 30, '5': 43 },
    recentComments: ['More hands-on time with the LMS please.', 'Very clear walkthrough of email setup.', 'Room was too warm.'],
  },
  {
    activityType: 'EVENT',
    activityId: 'EVT-0990',
    title: 'Library Research Skills Workshop',
    responseCount: 34,
    averageRating: 4.6,
    ratingDistribution: { '1': 0, '2': 1, '3': 2, '4': 8, '5': 23 },
    recentComments: ['Database search tips were excellent.', 'Would like an advanced session.'],
  },
  {
    activityType: 'SERVICE_REQUEST',
    activityId: 'IT Support',
    title: 'IT Support requests',
    responseCount: 52,
    averageRating: 3.8,
    ratingDistribution: { '1': 3, '2': 5, '3': 10, '4': 18, '5': 16 },
    recentComments: ['Fixed quickly once assigned.', 'Took three days to get a response.'],
  },
  {
    activityType: 'SERVICE_REQUEST',
    activityId: 'Facilities Maintenance',
    title: 'Facilities Maintenance requests',
    responseCount: 29,
    averageRating: 3.4,
    ratingDistribution: { '1': 3, '2': 4, '3': 7, '4': 9, '5': 6 },
    recentComments: ['Technician was friendly.', 'Had to follow up twice.'],
  },
];

const isDemoInsightUser = () => (getG8DemoIdentity()?.roles ?? []).some((role) => FEEDBACK_INSIGHT_ROLES.includes(role));
const findDemoActivity = (type: ActivityType, id: string) =>
  demoActivities.find((activity) => activity.activityType === type && activity.activityId === id);

/* ------------------------------------------------------------------ */
/* communication-feedback-service feedback shapes                     */
/* ------------------------------------------------------------------ */

interface FormResponse {
  id: string;
  activityType: ActivityType;
  activityId: string;
  createdBy: string;
  title: string;
  questionsJson: string;
  active: boolean;
  createdAt: string;
}

interface ResponseItem {
  id: string;
  formId: string;
  activityId: string;
  respondentId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** The service stores one rating and one comment per response, so forms have exactly these two. */
const DEFAULT_QUESTIONS: FeedbackQuestion[] = [
  { id: 'rating', label: 'Overall, how would you rate this?', type: 'RATING', required: true },
  { id: 'comment', label: 'Any comments?', type: 'TEXT', required: false },
];

function parseQuestions(questionsJson: string): FeedbackQuestion[] {
  try {
    const parsed = JSON.parse(questionsJson) as Partial<FeedbackQuestion>[];
    const rating = parsed.find((question) => question.type === 'RATING');
    const text = parsed.find((question) => question.type === 'TEXT');
    return [
      { ...DEFAULT_QUESTIONS[0], label: rating?.label || DEFAULT_QUESTIONS[0].label },
      { ...DEFAULT_QUESTIONS[1], label: text?.label || DEFAULT_QUESTIONS[1].label },
    ];
  } catch {
    return DEFAULT_QUESTIONS;
  }
}

function toUiForm(form: FormResponse): FeedbackForm {
  return { id: form.id, activityType: form.activityType, title: form.title, questions: parseQuestions(form.questionsJson) };
}

/** Each open form is one activity to review; the route id is the form id. */
function toUiActivity(form: FormResponse): FeedbackActivity {
  return {
    activityType: form.activityType,
    activityId: form.id,
    title: form.title,
    sourceStatus: 'OPEN',
    completedAt: form.createdAt,
    // Eligibility (completed, took part / requested it) is decided when the response is submitted.
    eligible: true,
    alreadySubmitted: false,
  };
}

function summarize(form: FormResponse, responses: ResponseItem[]): FeedbackSummary {
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as FeedbackSummary['ratingDistribution'];
  responses.forEach((response) => {
    const key = String(response.rating) as keyof FeedbackSummary['ratingDistribution'];
    if (key in distribution) distribution[key] += 1;
  });
  const total = responses.reduce((sum, response) => sum + response.rating, 0);
  return {
    activityType: form.activityType,
    activityId: form.activityId,
    title: form.title,
    responseCount: responses.length,
    averageRating: responses.length ? Math.round((total / responses.length) * 10) / 10 : 0,
    ratingDistribution: distribution,
    recentComments: responses.map((response) => response.comment?.trim()).filter((comment): comment is string => Boolean(comment)).slice(0, 5),
  };
}

function answerOf(answers: FeedbackAnswer[], type: 'RATING' | 'TEXT'): FeedbackAnswer | undefined {
  return answers.find((answer) => (type === 'RATING' ? answer.rating !== undefined : Boolean(answer.text?.trim())));
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function getMyFeedbackActivities(): Promise<G8Result<FeedbackActivity[]>> {
  return g8RequestMapped<FormResponse[], FeedbackActivity[]>(`${FEEDBACK_API}/forms`, {
    demo: () => g8Ok(demoActivities.map((activity) => ({ ...activity })), true),
  }, (forms) => forms.filter((form) => form.active).map(toUiActivity));
}

export function getFeedbackForm(activityType: ActivityType, activityId: string): Promise<G8Result<FeedbackForm>> {
  return g8RequestMapped<FormResponse, FeedbackForm>(`${FEEDBACK_API}/forms/${encodeURIComponent(activityId)}`, {
    demo: () => {
      const activity = findDemoActivity(activityType, activityId);
      if (!activity) return g8Fail(404, 'You have no record of this activity, so feedback is not available.', true);
      if (activity.alreadySubmitted) return g8Fail(409, 'You have already submitted feedback for this activity.', true);
      if (!activity.eligible) return g8Fail(409, activity.ineligibleReason ?? 'This activity is not completed yet.', true);
      return g8Ok(activityType === 'EVENT' ? EVENT_FORM : SERVICE_FORM, true);
    },
  }, toUiForm);
}

export function submitFeedback(request: FeedbackSubmitRequest): Promise<G8Result<{ id: string }>> {
  return g8RequestMapped<ResponseItem, { id: string }>(`${FEEDBACK_API}/forms/${encodeURIComponent(request.activityId)}/responses`, {
    method: 'POST',
    body: {
      rating: answerOf(request.answers, 'RATING')?.rating,
      comment: answerOf(request.answers, 'TEXT')?.text?.trim() || null,
    },
    demo: () => {
      const activity = findDemoActivity(request.activityType, request.activityId);
      if (!activity) return g8Fail(404, undefined, true);
      if (activity.alreadySubmitted) return g8Fail(409, 'You have already submitted feedback for this activity.', true);
      if (!activity.eligible) return g8Fail(409, activity.ineligibleReason, true);
      const form = request.activityType === 'EVENT' ? EVENT_FORM : SERVICE_FORM;
      const missing = form.questions.find(
        (question) =>
          question.required &&
          !request.answers.some(
            (answer) =>
              answer.questionId === question.id &&
              (answer.rating !== undefined || answer.yesNo !== undefined || Boolean(answer.text?.trim()))
          )
      );
      if (missing) return g8Fail(400, `Please answer: "${missing.label}"`, true);
      activity.alreadySubmitted = true;
      return g8Ok({ id: nextDemoId('FBR') }, true);
    },
  }, (response) => ({ id: response.id }));
}

export function getFeedbackSummaries(activityType?: ActivityType): Promise<G8Result<FeedbackSummary[]>> {
  return g8RequestMapped<FormResponse[], FeedbackSummary[]>(
    `${FEEDBACK_API}/forms`,
    {
      demo: () => {
        if (!isDemoInsightUser()) return g8Fail(403, 'Only authorized staff can view feedback summaries.', true);
        return g8Ok(
          demoSummaries.filter((summary) => !activityType || summary.activityType === activityType).map((s) => ({ ...s })),
          true
        );
      },
    },
    async (forms) => {
      // No summary endpoint yet: responses are readable by each form's creator, so aggregate those.
      const relevant = forms.filter((form) => !activityType || form.activityType === activityType);
      const results = await Promise.all(
        relevant.map((form) => g8Request<ResponseItem[]>(`${FEEDBACK_API}/forms/${encodeURIComponent(form.id)}/responses`))
      );
      return relevant.flatMap((form, index) => {
        const result = results[index];
        return result.ok && !result.demo ? [summarize(form, result.data)] : [];
      });
    }
  );
}

export interface CreateFeedbackFormInput {
  activityType: ActivityType;
  activityId: string;
  title: string;
  ratingLabel?: string;
  commentLabel?: string;
}

/** Organizers open a form for a completed activity; users can then answer it (US8-12). */
export function createFeedbackForm(input: CreateFeedbackFormInput): Promise<G8Result<FeedbackForm>> {
  const questions: FeedbackQuestion[] = [
    { ...DEFAULT_QUESTIONS[0], label: input.ratingLabel || DEFAULT_QUESTIONS[0].label },
    { ...DEFAULT_QUESTIONS[1], label: input.commentLabel || DEFAULT_QUESTIONS[1].label },
  ];
  return g8RequestMapped<FormResponse, FeedbackForm>(
    `${FEEDBACK_API}/forms`,
    {
      method: 'POST',
      body: { activityType: input.activityType, activityId: input.activityId, title: input.title, questionsJson: JSON.stringify(questions) },
      demo: () => g8Ok({ id: nextDemoId('FRM'), activityType: input.activityType, title: input.title, questions }, true),
    },
    toUiForm
  );
}

/* ------------------------------------------------------------------ */
/* Engagement                                                          */
/* ------------------------------------------------------------------ */

export function getEngagementSummary(): Promise<G8Result<EngagementSummary>> {
  return g8Request<EngagementSummary>(`${ENGAGEMENT_API}/summary`, {
    demo: () => {
      if (!isDemoInsightUser()) return g8Fail(403, 'Only authorized staff can view the engagement dashboard.', true);
      const totalResponses = demoSummaries.reduce((sum, summary) => sum + summary.responseCount, 0);
      const weightedRating =
        demoSummaries.reduce((sum, summary) => sum + summary.averageRating * summary.responseCount, 0) / totalResponses;
      return g8Ok(
        {
          totals: {
            publishedEvents: 4,
            activeRegistrations: 81,
            announcementsPublished: 3,
            feedbackResponses: totalResponses,
            averageRating: Math.round(weightedRating * 10) / 10,
          },
          eventParticipation: [
            { eventId: 'EVT-1006', title: 'Freshers Orientation: Digital Services', capacity: 300, confirmed: 212 },
            { eventId: 'EVT-1003', title: 'Postgraduate Research Symposium', capacity: 60, confirmed: 41 },
            { eventId: 'EVT-1001', title: 'Innovation Week Workshop', capacity: 40, confirmed: 18 },
            { eventId: 'EVT-1004', title: 'Cloud Computing Webinar (Staff CPD)', capacity: 100, confirmed: 22 },
            { eventId: 'EVT-1002', title: 'Industry Career Fair 2026', capacity: 2, confirmed: 2 },
          ],
          announcementReach: [
            { announcementId: 'ANN-2001', title: 'Semester 2 examination timetable released', audienceLabel: 'Everyone', recipients: 5200, readCount: 3860 },
            { announcementId: 'ANN-2002', title: 'Computing lab maintenance this Saturday', audienceLabel: 'Departments: DEP-CS', recipients: 610, readCount: 402 },
            { announcementId: 'ANN-2003', title: 'Staff CPD: research grant writing clinic', audienceLabel: 'Roles: Staff, HOD, Dean', recipients: 565, readCount: 211 },
          ],
        },
        true
      );
    },
  });
}
