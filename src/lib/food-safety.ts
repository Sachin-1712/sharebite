export const FOOD_SAFETY_OLD_ERROR = 'For safety, food cooked more than 24 hours ago cannot be donated.';
export const FOOD_SAFETY_FUTURE_ERROR = 'Prepared time cannot be in the future.';
export const FOOD_SAFETY_REQUIRED_ERROR = 'Please enter when the food was cooked/prepared.';

const MAX_PREPARED_AGE_MS = 24 * 60 * 60 * 1000;

export function validatePreparedAt(value?: string, now = new Date()) {
  if (!value) {
    return { ok: false, error: FOOD_SAFETY_REQUIRED_ERROR };
  }

  const preparedAt = new Date(value);
  const preparedTime = preparedAt.getTime();

  if (Number.isNaN(preparedTime)) {
    return { ok: false, error: FOOD_SAFETY_REQUIRED_ERROR };
  }

  const nowTime = now.getTime();

  if (preparedTime > nowTime) {
    return { ok: false, error: FOOD_SAFETY_FUTURE_ERROR };
  }

  if (nowTime - preparedTime > MAX_PREPARED_AGE_MS) {
    return { ok: false, error: FOOD_SAFETY_OLD_ERROR };
  }

  return { ok: true, error: null };
}

export function combineLocalDateAndTime(date: string, time: string) {
  if (!date || !time) return '';
  return new Date(`${date}T${time}:00`).toISOString();
}

export function splitISOToLocalDateTime(value?: string) {
  if (!value) return { date: '', time: '' };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}
