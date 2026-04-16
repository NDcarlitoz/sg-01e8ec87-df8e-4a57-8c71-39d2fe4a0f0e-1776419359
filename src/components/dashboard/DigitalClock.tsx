import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[time.getDay()];
    
    const hours = String(time.getHours()).padStart(2, "0");
    const minutes = String(time.getMinutes()).padStart(2, "0");
    const seconds = String(time.getSeconds()).padStart(2, "0");
    
    const day = String(time.getDate()).padStart(2, "0");
    const month = String(time.getMonth() + 1).padStart(2, "0");
    const year = time.getFullYear();
    
    return `${dayName}, ${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium">
      <Clock className="h-4 w-4 text-primary" />
      <span className="font-mono">{formatTime()}</span>
    </div>
  );
}