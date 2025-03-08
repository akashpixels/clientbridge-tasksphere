
import React from 'react';
import { Slider } from "@/components/ui/slider";

interface PriorityLevel {
  id: number;
  name: string;
  color?: string;
}

interface PriorityDialProps {
  priorityLevels: PriorityLevel[];
  value: number;
  onChange: (value: number) => void;
}

export const PriorityDial = ({ priorityLevels, value, onChange }: PriorityDialProps) => {
  const sortedLevels = [...priorityLevels].sort((a, b) => a.id - b.id);
  const maxValue = sortedLevels.length > 0 ? Math.max(...sortedLevels.map(level => level.id)) : 5;
  
  const handleChange = (newValue: number[]) => {
    // Find the closest priority level
    if (newValue.length > 0) {
      onChange(newValue[0]);
    }
  };

  // Get current priority color
  const currentLevel = priorityLevels.find(level => level.id === value);
  const color = currentLevel?.color || "#9CA3AF";

  return (
    <div className="relative">
      <Slider
        defaultValue={[value]}
        max={maxValue}
        min={1}
        step={1}
        onValueChange={handleChange}
        className="mb-6"
      />
      
      <div className="flex justify-between mt-2">
        {sortedLevels.map(level => (
          <div key={level.id} className="text-center">
            <div 
              className={`w-3 h-3 rounded-full mx-auto mb-1 ${value === level.id ? 'ring-2 ring-offset-2' : ''}`}
              style={{ backgroundColor: level.color || "#9CA3AF" }}
            ></div>
            <span className="text-xs">{level.name}</span>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-4">
        <div className="text-sm font-medium" style={{ color }}>
          Selected: {currentLevel?.name || "Normal"}
        </div>
      </div>
    </div>
  );
};
