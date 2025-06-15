
import { format, isWithinInterval, parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const JAMAICA_TIMEZONE = 'America/Jamaica';

// Get current time in Jamaica timezone
export const getJamaicaTime = (): Date => {
  return toZonedTime(new Date(), JAMAICA_TIMEZONE);
};

export const parseTimeString = (timeStr: string): Date => {
  if (!timeStr) {
    return new Date(NaN); // Return invalid date for empty/falsy input
  }
  try {
    // Handle formats like "9:00 AM", "12:30 PM", etc.
    return parse(timeStr, 'h:mm a', new Date());
  } catch {
    // Fallback to basic format
    return parse(timeStr, 'HH:mm', new Date());
  }
};

// Convert time to minutes since midnight for comparison
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return -1;
  
  try {
    const time = parseTimeString(timeStr);
    if (isNaN(time.getTime())) return -1;
    
    return time.getHours() * 60 + time.getMinutes();
  } catch {
    return -1;
  }
};

// Check if current time is within a time range
const isTimeInRange = (currentMinutes: number, startMinutes: number, endMinutes: number): boolean => {
  if (startMinutes === -1 || endMinutes === -1) return false;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

export const getCurrentPeriod = (
  breakfastStart: string,
  breakfastEnd: string,
  lunchStart: string,
  lunchEnd: string
): 'breakfast' | 'lunch' | 'closed' => {
  // Get current time in Jamaica timezone
  const jamaicaTime = getJamaicaTime();
  const currentMinutes = jamaicaTime.getHours() * 60 + jamaicaTime.getMinutes();
  
  console.log('Current Jamaica time:', jamaicaTime.toLocaleTimeString('en-US', { 
    timeZone: JAMAICA_TIMEZONE,
    hour12: true 
  }));
  console.log('Current minutes:', currentMinutes);
  console.log('Restaurant times:', { breakfastStart, breakfastEnd, lunchStart, lunchEnd });
  
  // Convert restaurant times to minutes
  const breakfastStartMinutes = timeToMinutes(breakfastStart);
  const breakfastEndMinutes = timeToMinutes(breakfastEnd);
  const lunchStartMinutes = timeToMinutes(lunchStart);
  const lunchEndMinutes = timeToMinutes(lunchEnd);
  
  console.log('Time ranges in minutes:', {
    breakfast: `${breakfastStartMinutes}-${breakfastEndMinutes}`,
    lunch: `${lunchStartMinutes}-${lunchEndMinutes}`
  });
  
  // Check if current time is within lunch period first (prioritize lunch)
  const isLunchTime = isTimeInRange(currentMinutes, lunchStartMinutes, lunchEndMinutes);
  
  // Check if current time is within breakfast period
  const isBreakfastTime = isTimeInRange(currentMinutes, breakfastStartMinutes, breakfastEndMinutes);
  
  console.log('Period checks:', { isLunchTime, isBreakfastTime });
  
  if (isLunchTime) {
    return 'lunch';
  } else if (isBreakfastTime) {
    return 'breakfast';
  } else {
    return 'closed';
  }
};

export const getRandomVibrantColor = (): string => {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500', 
    'from-green-500 to-teal-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-green-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500'
  ];
  
  // Use Jamaica time for consistent daily colors
  const jamaicaTime = getJamaicaTime();
  const today = jamaicaTime.toDateString();
  const hash = today.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Format Jamaica time for display
export const formatJamaicaTime = (date?: Date): string => {
  const timeToFormat = date || getJamaicaTime();
  return format(toZonedTime(timeToFormat, JAMAICA_TIMEZONE), 'h:mm a');
};

// Get Jamaica date string
export const getJamaicaDateString = (): string => {
  return getJamaicaTime().toDateString();
};
