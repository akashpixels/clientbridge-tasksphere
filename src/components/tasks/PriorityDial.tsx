
import { useState } from "react";

interface PriorityLevel {
  id: number;
  name: string;
  color?: string;
  time_to_start?: string;
  multiplier?: number;
}

interface PriorityDialProps {
  priorityLevels: PriorityLevel[];
  value: number;
  onChange: (value: number) => void;
}

export const PriorityDial = ({ priorityLevels, value, onChange }: PriorityDialProps) => {
  const [selectedPriority, setSelectedPriority] = useState<number>(value);

  const handlePriorityChange = (priorityId: number) => {
    setSelectedPriority(priorityId);
    onChange(priorityId);
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {priorityLevels.map((level) => (
        <button
          key={level.id}
          type="button"
          onClick={() => handlePriorityChange(level.id)}
          className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-all ${
            selectedPriority === level.id 
              ? 'ring-2 ring-offset-2 scale-110' 
              : 'opacity-70'
          }`}
          style={{
            backgroundColor: level.color || '#6B7280',
            color: '#ffffff'
          }}
          title={level.name}
        >
          {level.id}
        </button>
      ))}
    </div>
  );
};
