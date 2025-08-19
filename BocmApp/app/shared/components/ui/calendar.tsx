import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[];
  onSelect?: (date: Date | Date[] | undefined) => void;
  disabled?: (date: Date) => boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface CalendarHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface CalendarGridProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface CalendarCellProps {
  date: Date;
  selected?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ 
  mode = 'single',
  selected,
  onSelect,
  disabled,
  style,
  className 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    selected ? (Array.isArray(selected) ? selected : [selected]) : []
  );

  const handleDateSelect = (date: Date) => {
    if (disabled?.(date)) return;

    let newSelectedDates: Date[];

    if (mode === 'single') {
      newSelectedDates = [date];
    } else if (mode === 'multiple') {
      const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
      if (isSelected) {
        newSelectedDates = selectedDates.filter(d => d.toDateString() !== date.toDateString());
      } else {
        newSelectedDates = [...selectedDates, date];
      }
    } else {
      // range mode
      if (selectedDates.length === 0 || selectedDates.length === 2) {
        newSelectedDates = [date];
      } else {
        const firstDate = selectedDates[0];
        if (date < firstDate) {
          newSelectedDates = [date, firstDate];
        } else {
          newSelectedDates = [firstDate, date];
        }
      }
    }

    setSelectedDates(newSelectedDates);
    onSelect?.(mode === 'single' ? newSelectedDates[0] : newSelectedDates);
  };

  const isSelected = (date: Date) => {
    return selectedDates.some(d => d.toDateString() === date.toDateString());
  };

  const isInRange = (date: Date) => {
    if (mode !== 'range' || selectedDates.length !== 2) return false;
    const [start, end] = selectedDates;
    return date >= start && date <= end;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <View style={[tw`w-full`, style]}>
      <CalendarHeader>
        <View style={tw`flex flex-row items-center justify-between`}>
          <TouchableOpacity onPress={goToPreviousMonth} activeOpacity={0.7}>
            <ChevronLeft size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-semibold`, { color: theme.colors.foreground }]}>
            {monthName}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} activeOpacity={0.7}>
            <ChevronRight size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      </CalendarHeader>
      
      <CalendarGrid>
        <View style={tw`grid grid-cols-7 gap-1`}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} style={tw`h-9 w-9 flex items-center justify-center`}>
              <Text style={[tw`text-sm font-medium`, { color: theme.colors.mutedForeground }]}>
                {day}
              </Text>
            </View>
          ))}
          
          {days.map((date, index) => (
            <CalendarCell
              key={index}
              date={date || new Date()}
              selected={date ? isSelected(date) : false}
              disabled={date ? disabled?.(date) || false : true}
              onPress={date ? () => handleDateSelect(date) : undefined}
            />
          ))}
        </View>
      </CalendarGrid>
    </View>
  );
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <View style={[tw`flex flex-col space-y-1.5 p-3`, style]}>
      {children}
    </View>
  );
};

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <View style={[tw`p-3 pt-0`, style]}>
      {children}
    </View>
  );
};

const CalendarCell: React.FC<CalendarCellProps & { onPress?: () => void }> = ({ 
  date,
  selected = false,
  disabled = false,
  style,
  className,
  onPress
}) => {
  if (!date) {
    return <View style={tw`h-9 w-9`} />;
  }

  return (
    <TouchableOpacity
      style={[
        tw`h-9 w-9 flex items-center justify-center rounded-md text-sm font-medium`,
        selected ? {
          backgroundColor: theme.colors.primary,
        } : {
          backgroundColor: 'transparent',
        },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          tw`text-sm font-medium`,
          { 
            color: selected ? theme.colors.primaryForeground : theme.colors.foreground 
          }
        ]}
      >
        {date.getDate()}
      </Text>
    </TouchableOpacity>
  );
};

export { Calendar, CalendarHeader, CalendarGrid, CalendarCell }; 