import Holidays from 'date-holidays';

/**
 * Calculates timezone offset compared to Toronto (America/Toronto).
 * Uses date-holidays library to query holiday and timezone information by country/state.
 */
export function calculateTorontoOffset(countryCode = 'CA', stateCode = 'ON') {
  try {
    const hd = new Holidays(countryCode, stateCode);
    const timezones = hd.getTimezones();
    const userTimezone = (timezones && timezones.length > 0) ? timezones[0] : 'America/Toronto';

    const now = new Date();

    // Get Toronto offset in minutes
    const torontoString = now.toLocaleString('en-US', { timeZone: 'America/Toronto', timeZoneName: 'shortOffset' });
    const torontoOffsetMatch = torontoString.match(/GMT([+-]\d+)(?::(\d+))?/);
    const torontoOffsetHours = torontoOffsetMatch ? parseInt(torontoOffsetMatch[1], 10) : -4;

    // Get User location offset in minutes
    const userString = now.toLocaleString('en-US', { timeZone: userTimezone, timeZoneName: 'shortOffset' });
    const userOffsetMatch = userString.match(/GMT([+-]\d+)(?::(\d+))?/);
    const userOffsetHours = userOffsetMatch ? parseInt(userOffsetMatch[1], 10) : -4;

    const diffHours = userOffsetHours - torontoOffsetHours;

    let diffString = 'Same time as Toronto';
    if (diffHours > 0) {
      diffString = `+${diffHours} hrs vs Toronto`;
    } else if (diffHours < 0) {
      diffString = `${diffHours} hrs vs Toronto`;
    }

    return {
      timezone: userTimezone,
      diffHours,
      diffString
    };
  } catch (error) {
    return {
      timezone: 'America/Toronto',
      diffHours: 0,
      diffString: 'Same time as Toronto'
    };
  }
}