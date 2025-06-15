
import { useState, useEffect, useRef } from 'react';
import { getCurrentPeriod } from '../utils/timeUtils';

export const usePeriodCheck = (
  breakfastStartTime: string,
  breakfastEndTime: string,
  lunchStartTime: string,
  lunchEndTime: string
) => {
  const [currentPeriod, setCurrentPeriod] = useState<'breakfast' | 'lunch' | 'closed'>('closed');
  const periodCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Determine current period
  const determineCurrentPeriod = () => {
    const period = getCurrentPeriod(
      breakfastStartTime,
      breakfastEndTime,
      lunchStartTime,
      lunchEndTime
    );
    
    console.log('Determined period:', period);
    return period;
  };

  // Check and update period if changed
  const checkAndUpdatePeriod = () => {
    const newPeriod = determineCurrentPeriod();
    if (newPeriod !== currentPeriod) {
      console.log('Period changed from', currentPeriod, 'to', newPeriod);
      setCurrentPeriod(newPeriod);
    }
  };

  // Start periodic checking every minute
  const startPeriodCheck = () => {
    periodCheckInterval.current = setInterval(() => {
      checkAndUpdatePeriod();
    }, 60000); // Check every minute
  };

  useEffect(() => {
    // Initial period determination
    setCurrentPeriod(determineCurrentPeriod());
    
    // Start periodic checks
    startPeriodCheck();
    
    // Cleanup intervals on unmount
    return () => {
      if (periodCheckInterval.current) {
        clearInterval(periodCheckInterval.current);
      }
    };
  }, [breakfastStartTime, breakfastEndTime, lunchStartTime, lunchEndTime]);

  return currentPeriod;
};
