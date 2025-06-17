
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getJamaicaTime, formatJamaicaTime } from '../utils/timeUtils';

export const JamaicaClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const jamaicaTime = getJamaicaTime();
      setCurrentTime(formatJamaicaTime(jamaicaTime));
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">
        Jamaica Time: {currentTime}
      </span>
    </div>
  );
};
