
import { formatTimelineTime, formatHourDifference } from "@/lib/date-utils";

interface StartEtaPredictorProps {
  compact?: boolean;
}

export const StartEtaPredictor = ({ compact = false }: StartEtaPredictorProps) => {
  // Static timeline data
  const timelineData = {
    startTime: "2025-03-17T12:00:00Z",
    eta: "2025-03-17T14:00:00Z",
    hoursNeeded: "2 hours"
  };

  // Returns a formatted string based on static hoursNeeded data
  const getTimeBetweenNodes = () => {
    return formatHourDifference(timelineData.hoursNeeded);
  };

  const formatTimeWithLineBreak = (timeString: string | null): React.ReactNode => {
    if (!timeString) return "";
    const parts = timeString.split(", ");
    if (parts.length !== 2) return timeString;
    return (
      <>
        {parts[0]}
        <br />
        {parts[1]}
      </>
    );
  };

  return (
    <div className="sticky top-0 bg-background z-10">
      <div className="pt-7 pb-0">
        <div className="relative">
          <div className="absolute top-[-8px] left-[60%] -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes()}
          </div>
          <div className="flex justify-between items-center mb-2 pt-1 pb-1 relative min-h-[32px]">
            <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-gray-300 z-0"></div>
            <div className="flex flex-col items-start z-10 pl-0">
              <div className="relative h-[20px] flex items-center">
                <div className="w-[1px] h-[13px] bg-gray-300 absolute left-0 top-[-8px]"></div>
              </div>
            </div>
            <div className="absolute left-[35%] -translate-x-1/2 z-10 flex flex-col items-center">
              <div className="h-[22px] w-[40px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                Start
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-center min-h-[24px]">
                {formatTimeWithLineBreak(formatTimelineTime(timelineData.startTime))}
              </div>
            </div>
            <div className="flex flex-col items-end z-10 pr-0">
              <div className="relative h-[20px] flex items-center">
                <div className="h-[22px] w-[35px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600 absolute right-0">
                  ETA
                </div>
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-right min-h-[24px]">
                {formatTimeWithLineBreak(formatTimelineTime(timelineData.eta))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartEtaPredictor;
