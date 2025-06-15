
import { format, isWithinInterval, parse } from 'date-fns';

export const parseTimeString = (timeStr: string): Date => {
  try {
    // Handle formats like "9:00 AM", "12:30 PM", etc.
    return parse(timeStr, 'h:mm a', new Date());
  } catch {
    // Fallback to basic format
    return parse(timeStr, 'HH:mm', new Date());
  }
};

export const getCurrentPeriod = (
  breakfastStart: string,
  breakfastEnd: string,
  lunchStart: string,
  lunchEnd: string
): 'break' | 'lunch' | 'closed' => {
  const now = new Date();
  const currentTime = parse(format(now, 'HH:mm'), 'HH:mm', new Date());
  
  const breakStartTime = parseTimeString(breakfastStart);
  const breakEndTime = parseTimeString(breakfastEnd);
  const lunchStartTime = parseTimeString(lunchStart);
  const lunchEndTime = parseTimeString(lunchEnd);

  if (isWithinInterval(currentTime, { start: breakStartTime, end: breakEndTime })) {
    return 'break';
  }
  
  if (isWithinInterval(currentTime, { start: lunchStartTime, end: lunchEndTime })) {
    return 'lunch';
  }
  
  return 'closed';
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
  
  // Use date as seed for consistent daily colors
  const today = new Date().toDateString();
  const hash = today.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};
