export function setPath(target: any, paths: string[], value: unknown) {
  if (paths.length === 1) {
    target[paths[0]] = value;
    return target;
  }

  let next = target;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (i === paths.length - 1) {
      next[path] = value;
    } else {
      const current = next[path];
      next = next[path] = current ?? (isNaN(paths[i + 1] as any) ? {} : []);
    }
  }
}

/**
 * Formats a date string based on the type of input. This is necessary because
 * HTML expects different formats for different input types. For example,
 * `date` expects a date in the format `YYYY-MM-DD` while `datetime-local`
 * expects a date in the format `YYYY-MM-DDTHH:mm`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats
 * @param date - The date to format.
 * @param type - The type of input.
 */
export function formatDateString(
  date: Date,
  type: React.HTMLInputTypeAttribute
) {
  // Adjust the date to account for the timezone offset.
  const isoDate = date.toISOString();

  if (type === "datetime-local") {
    // Formatted to YYYY-MM-DDTHH:mm
    return isoDate.slice(0, 16);
  } else if (type === "month") {
    // 2001-06
    return isoDate.slice(0, 7);
  } else if (type === "week") {
    // Format is YYYY-Www where YYYY is the year and ww is the week number.
    return getIsoWeek(date);
  } else if (type === "time") {
    // The value of the time in the 24-hour format e.g. `15:30`
    return isoDate.slice(11, 19);
  }

  date = removeTzOffset(date);
  return date.toISOString().slice(0, 10);
}

/**
 * Gets the week number of a date.
 * 
 * The week of the year is a two-digit string between 01 and 53. Each week begins
 * on Monday and ends on Sunday. That means it's possible for the first few days of
 * January to be considered part of the previous week-year, and for the last few days
 * of December to be considered part of the following week-year. The first week of the
 * year is the week that contains the first Thursday of the year. For example, the first
 * Thursday of 1953 was on January 1, so that week—beginning on Monday, December 29—
 * is considered the first week of the year. Therefore, December 30, 1952 occurs during
 * the week 1953-W01.
 
 * A year has 53 weeks if:
 *   The first day of the calendar year (January 1) is a Thursday or
 *   The first day of the year (January 1) is a Wednesday and the year is a leap year
 * All other years have 52 weeks.
 */
function getIsoWeek(date: Date): string {
  date = removeTzOffset(date);
  date = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  let year = date.getUTCFullYear();
  // Start of the year
  const startUtcTime = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1)
  ).getTime();
  const time = date.getTime();
  // Calculate full weeks to nearest Thursday
  let weekNo = Math.ceil(((time - startUtcTime) / dayMs + 1) / 7);
  // Handle last week of the previous year
  if (weekNo === 0) {
    const prevYear = year - 1;
    const prevYearStartTime = new Date(Date.UTC(prevYear, 0, 1)).getTime();
    weekNo = Math.ceil(
      ((time - prevYearStartTime) / dayMs +
        1 +
        // If the year is a leap year, add 1 day
        (!(year % 4 || (!(year % 100) && year % 400)) ? 366 : 365)) /
        7
    );
    year = prevYear;
  }
  // Return array of year and week number
  return year + "-W" + ("" + weekNo).padStart(2, "0");
}

const dayMs = 86400000; // 24 * 60 * 60 * 1000

function removeTzOffset(date: Date): Date {
  return new Date(date.getTime() + new Date().getTimezoneOffset() * 60 * 1000);
}
