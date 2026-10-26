import { getIsoWeekCount } from './weeklyDates';
import moment from 'moment-timezone';

test('week counts do not depend on the current date or its ISO year', () => {
  const clock = jest.spyOn(moment, 'now').mockReturnValue(Date.parse('2027-01-01T12:00:00Z'));
  try {
    expect(getIsoWeekCount(2026)).toBe(53);
    expect(getIsoWeekCount(2027)).toBe(52);
    expect(getIsoWeekCount(2020)).toBe(53);
  } finally {
    clock.mockRestore();
  }
});
