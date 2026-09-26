import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareText, Star } from 'lucide-react';
import { Button, Card, CardBody, CardFooter, CardHeader, ErrorState, LoadingState } from '@/components/ui';
import { DemoDataNotice, G8Alert, G8PageHeader, Group8Page } from '@/components/group8';
import { getFeedbackForm, submitFeedback } from '@/services/group8';
import { useAppDispatch, userActivityRecorded } from '@/store';
import type { ActivityType, FeedbackAnswer, FeedbackForm, FeedbackQuestion } from '@/types';
import { cn } from '@/utils';
import './group8Pages.css';

const RATING_LABELS = ['Very poor', 'Poor', 'Average', 'Good', 'Excellent'];

const RatingInput: React.FC<{
  question: FeedbackQuestion;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}> = ({ question, value, onChange, error }) => (
  <fieldset className="g8-question" aria-describedby={error ? `${question.id}-error` : undefined}>
    <legend className="form-label">
      {question.label}
      {question.required && <span className="g8-required"> *</span>}
    </legend>
    <div className="g8-rating" role="radiogroup">
      {[1, 2, 3, 4, 5].map((score) => (
        <label key={score} className={cn('g8-rating-option', value !== undefined && score <= value && 'filled')}>
          <input
            type="radio"
            name={question.id}
            value={score}
            checked={value === score}
            onChange={() => onChange(score)}
            aria-label={`${score} - ${RATING_LABELS[score - 1]}`}
          />
          <Star size={26} aria-hidden="true" />
        </label>
      ))}
      <span className="g8-rating-text" aria-hidden="true">
        {value ? RATING_LABELS[value - 1] : 'Select a rating'}
      </span>
    </div>
    {error && (
      <span id={`${question.id}-error`} className="form-error-text" role="alert">
        {error}
      </span>
    )}
  </fieldset>
);

export const FeedbackFormPage: React.FC = () => {
  const { activityType = '', activityId = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const type = activityType.toUpperCase() as ActivityType;

  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, FeedbackAnswer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ title: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let active = true;
    if (type !== 'EVENT' && type !== 'SERVICE_REQUEST') {
      Promise.resolve().then(() => {
        if (!active) return;
        setLoadError({ title: 'Unknown activity', message: 'This feedback link is not valid.' });
        setIsLoading(false);
      });
      return () => {
        active = false;
      };
    }
    getFeedbackForm(type, activityId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setForm(result.data);
      } else {
        // Eligibility is decided by the service (and Group 7 for requests) - show its reason.
        setLoadError({
          title:
            result.kind === 'conflict'
              ? 'Feedback not available'
              : result.kind === 'dependency_unavailable'
                ? 'Service status unavailable'
                : 'Could not open feedback form',
          message:
            result.kind === 'dependency_unavailable'
              ? 'We could not confirm this service request with the Service Desk right now. Please try again later.'
              : result.message,
        });
      }
      setIsDemo(result.demo);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [type, activityId]);

  const setAnswer = (questionId: string, patch: Partial<FeedbackAnswer>) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], questionId, ...patch } }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSubmitError(null);

    const found: Record<string, string> = {};
    form.questions.forEach((question) => {
      const answer = answers[question.id];
      if (!question.required) return;
      if (question.type === 'RATING' && !answer?.rating) found[question.id] = 'Please choose a rating.';
      if (question.type === 'YES_NO' && answer?.yesNo === undefined) found[question.id] = 'Please choose yes or no.';
      if (question.type === 'TEXT' && !answer?.text?.trim()) found[question.id] = 'Please write a short answer.';
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError('Please answer the required questions.');
      return;
    }

    setIsSubmitting(true);
    const result = await submitFeedback({
      activityType: type,
      activityId,
      formId: form.id,
      answers: Object.values(answers).map((answer) => ({ ...answer, text: answer.text?.trim() || undefined })),
    });
    setIsSubmitting(false);

    if (result.ok) {
      dispatch(userActivityRecorded());
      navigate('/feedback', { state: { flash: 'Thank you! Your feedback has been recorded.' } });
      return;
    }
    setSubmitError(result.message);
  };

  const backLink = (
    <div>
      <Link to="/feedback" className="g8-back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to feedback
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <Group8Page>
        <LoadingState title="Checking eligibility..." description="Confirming this activity is completed and belongs to you." />
      </Group8Page>
    );
  }

  if (loadError || !form) {
    return (
      <Group8Page>
        {backLink}
        <DemoDataNotice show={isDemo} />
        <ErrorState title={loadError?.title} description={loadError?.message} />
      </Group8Page>
    );
  }

  return (
    <Group8Page>
      {backLink}

      <G8PageHeader
        title={form.title}
        subtitle={`${type === 'EVENT' ? 'Event' : 'Service request'} ${activityId} · Your answers are linked to this activity.`}
        icon={<MessageSquareText size={22} />}
      />

      <DemoDataNotice show={isDemo} />

      {submitError && (
        <G8Alert tone="danger" onDismiss={() => setSubmitError(null)}>
          {submitError}
        </G8Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader title="Your feedback" subtitle="Questions marked * are required." />
          <CardBody className="g8-question-list">
            {form.questions.map((question) => {
              const answer = answers[question.id];
              if (question.type === 'RATING') {
                return (
                  <RatingInput
                    key={question.id}
                    question={question}
                    value={answer?.rating}
                    onChange={(rating) => setAnswer(question.id, { rating })}
                    error={errors[question.id]}
                  />
                );
              }
              if (question.type === 'YES_NO') {
                return (
                  <fieldset key={question.id} className="g8-question">
                    <legend className="form-label">
                      {question.label}
                      {question.required && <span className="g8-required"> *</span>}
                    </legend>
                    <div className="g8-segmented" role="radiogroup">
                      {[true, false].map((option) => (
                        <button
                          key={String(option)}
                          type="button"
                          role="radio"
                          aria-checked={answer?.yesNo === option}
                          className={cn('g8-segment', answer?.yesNo === option && 'active')}
                          onClick={() => setAnswer(question.id, { yesNo: option })}
                        >
                          {option ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                    {errors[question.id] && (
                      <span className="form-error-text" role="alert">
                        {errors[question.id]}
                      </span>
                    )}
                  </fieldset>
                );
              }
              return (
                <div key={question.id} className="form-group g8-question">
                  <label htmlFor={question.id} className="form-label">
                    {question.label}
                    {question.required && <span className="g8-required"> *</span>}
                  </label>
                  <textarea
                    id={question.id}
                    className={cn('form-input g8-textarea', errors[question.id] && 'form-input-error')}
                    rows={4}
                    maxLength={1000}
                    value={answer?.text ?? ''}
                    onChange={(e) => setAnswer(question.id, { text: e.target.value })}
                  />
                  <span className="form-helper-text">{(answer?.text ?? '').length}/1000</span>
                  {errors[question.id] && (
                    <span className="form-error-text" role="alert">
                      {errors[question.id]}
                    </span>
                  )}
                </div>
              );
            })}
          </CardBody>
          <CardFooter className="g8-form-footer">
            <Link to="/feedback">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Submit feedback
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Group8Page>
  );
};
