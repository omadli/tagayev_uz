import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useSettings } from "../../../context/SettingsContext";
import { getMuiTheme } from "../../../theme/muiTheme";
import { ThemeProvider } from "@mui/material/styles";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { CircularProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import clsx from "clsx";
import { useTheme } from "@mui/material/styles";

// --- THIS IS THE DEFINITIVE FIX: THE CUSTOM DAY COMPONENT ---
// This new component receives all the date info and styling sets as props.
const CustomDay = (props) => {
  const {
    day,
    outsideCurrentMonth,
    lessonDays,
    holidays,
    rescheduledOld,
    rescheduledNew,
    ...other
  } = props;
  const theme = useTheme();
  const dateStr = day.format("YYYY-MM-DD");
  const isToday = day.isSame(dayjs(), "day");

  // Determine the style for the day
  let dayStyle = {};
  if (holidays.has(dateStr)) {
    dayStyle = { backgroundColor: theme.palette.calendar.holiday };
  } else if (rescheduledNew.has(dateStr)) {
    dayStyle = { backgroundColor: theme.palette.calendar.rescheduledNew };
  } else if (rescheduledOld.has(dateStr)) {
    dayStyle = {
      backgroundColor: theme.palette.calendar.rescheduledOld,
      textDecoration: "line-through",
    };
  } else if (lessonDays.has(dateStr)) {
    dayStyle = { backgroundColor: theme.palette.calendar.lesson };
  }

  const isPast = day.isBefore(dayjs(), "day");

  return (
    <PickersDay
      {...other}
      day={day}
      style={dayStyle}
      outsideCurrentMonth={outsideCurrentMonth}
      className={clsx(
        isPast && !isToday && "opacity-50",
        isToday && "!border-2 !border-blue-500"
      )}
    />
  );
};

const GroupCalendarTab = ({ group }) => {
  const { theme } = useSettings();
  const muiTheme = getMuiTheme(theme);

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(true);

  // State to hold the sets of different date types
  const [lessonDays, setLessonDays] = useState(new Set());
  const [holidays, setHolidays] = useState(new Set());
  const [rescheduledOld, setRescheduledOld] = useState(new Set());
  const [rescheduledNew, setRescheduledNew] = useState(new Set());

  // Fetch the detailed schedule for the currently viewed month
  useEffect(() => {
    setIsLoading(true);
    const year = currentMonth.year();
    const month = currentMonth.month() + 1;

    Promise.all([
      api.get(
        `/core/groups/${group.id}/lesson_schedule/?year=${year}&month=${month}`
      ),
      api.get(
        `/core/groups/${group.id}/schedule_details/?year=${year}&month=${month}`
      ),
    ])
      .then(([scheduleRes, detailsRes]) => {
        setLessonDays(new Set(scheduleRes.data.actual_lesson_dates || []));
        setHolidays(new Set(detailsRes.data.holidays.map((h) => h.date)));
        const oldDates = new Set();
        const newDates = new Set();
        detailsRes.data.overrides.forEach((o) => {
          if (o.original_date) oldDates.add(o.original_date);
          if (o.new_date) newDates.add(o.new_date);
        });
        setRescheduledOld(oldDates);
        setRescheduledNew(newDates);
      })
      .catch(() => {
        toast.error("Kalendar ma'lumotlarini yuklab bo'lmadi.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [group.id, currentMonth]);

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="bg-white dark:bg-dark-secondary rounded-lg p-4 shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-dark-secondary/50 flex justify-center items-center z-10">
            <CircularProgress />
          </div>
        )}
        <StaticDatePicker
          views={["day", "month", "year"]}
          defaultValue={currentMonth}
          onMonthChange={(newMonth) => setCurrentMonth(newMonth)}
          minDate={dayjs(group.start_date)}
          maxDate={dayjs(group.end_date)}
          slots={{ day: CustomDay }}
          slotProps={{
            day: {
              lessonDays,
              holidays,
              rescheduledOld,
              rescheduledNew,
            },
            toolbar: { hidden: true },
            actionBar: { actions: [] },
          }}
          displayStaticWrapperAs="desktop"
        />

        {/* --- LEGEND --- */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-4 border-t dark:border-dark-tertiary">
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-green-200 mr-2"></span>Dars
            kuni
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-red-200 mr-2"></span>Dam
            olish kuni
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-blue-200 mr-2"></span>
            Qo'shimcha/Ko'chirilgan dars
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-yellow-200 mr-2"></span>
            Bekor qilingan dars
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default GroupCalendarTab;
