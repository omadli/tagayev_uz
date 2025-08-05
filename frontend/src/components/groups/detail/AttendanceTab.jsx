import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useSettings } from "../../../context/SettingsContext";
import { getMuiTheme } from "../../../theme/muiTheme";
import { ThemeProvider } from "@mui/material/styles";
import {
  Tabs,
  Tab,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Check, X, Lock, Square, Minus, MessageSquareText } from "lucide-react";
import dayjs from "dayjs";
import clsx from "clsx";
import "dayjs/locale/uz-latn"; // Ensure Uzbek locale is loaded
dayjs.locale("uz-latn"); // Set dayjs to use Uzbek globally for month names

// Assume a CommentModal component exists
import CommentModal from "./CommentModal";

const AttendanceActionPopup = ({ onSelect, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bg-white dark:bg-dark-accent shadow-lg rounded-full flex z-20 p-1"
    >
      <Tooltip title="Kelmadi">
        <IconButton
          size="small"
          onClick={() => {
            onSelect(false);
            onClose();
          }}
        >
          <X className="text-red-500" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Keldi">
        <IconButton
          size="small"
          onClick={() => {
            onSelect(true);
            onClose();
          }}
        >
          <Check className="text-green-500" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Belgini o'chirish">
        <IconButton
          size="small"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
        >
          <Square className="text-gray-400" />
        </IconButton>
      </Tooltip>
    </div>
  );
};

const AttendanceTab = ({ group }) => {
  const { theme } = useSettings();
  const muiTheme = getMuiTheme(theme);

  // State
  const [view, setView] = useState({
    month: dayjs().month(),
    year: dayjs().year(),
  });
  const [data, setData] = useState({
    lesson_days: [],
    enrollments: [],
    attendance_data: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // State for the comment modal
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    record: null,
    studentName: "",
  });

  const [activeCell, setActiveCell] = useState(null);

  // Fetch data whenever the view (month/year) changes
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/core/groups/${group.id}/attendance/`, {
        params: { year: view.year, month: view.month + 1 },
      });
      setData(response.data);
    } catch {
      toast.error("Davomatni yuklab bo'lmadi.");
    } finally {
      setIsLoading(false);
    }
  }, [group.id, view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- REAL-TIME ATTENDANCE UPDATE ---
  const handleAttendanceChange = async (
    student_group_id,
    date,
    is_present,
    comment = ""
  ) => {
    const key = `${student_group_id}_${date}`;
    const originalData = JSON.parse(JSON.stringify(data));

    // Optimistic UI update
    const newData = { ...data };
    if (is_present === null) {
      delete newData.attendance_data[key];
    } else {
      newData.attendance_data[key] = { is_present, comment };
    }
    setData(newData);

    // API Call
    try {
      const response = await api.post(`/core/groups/${group.id}/attendance/`, {
        student_group_id,
        date,
        is_present,
        comment,
      });

      setData((prevData) => {
        const finalData = { ...prevData };
        if (is_present === null) {
          delete finalData.attendance_data[key];
        } else {
          finalData.attendance_data[key] = response.data;
        }
        return finalData;
      });

      // 4. Show a success toast
      toast.success("Davomat belgilandi!");
    } catch (error) {
      toast.error(error.response?.data?.comment?.[0] || "Xatolik yuz berdi!");
      setData(originalData);
    }
  };

  const onActionSelect = (is_present) => {
    if (!activeCell) return;
    const { enrollmentId, date } = activeCell;

    if (is_present === false) {
      const enrollment = data.enrollments.find(
        (e) => e.student_group_id === enrollmentId
      );
      setCommentModal({
        isOpen: true,
        record: { enrollmentId, date },
        studentName: enrollment ? enrollment.student_name : "",
      });
    } else {
      handleAttendanceChange(enrollmentId, date, is_present);
    }

    setActiveCell(null);
  };

  // --- RENDER LOGIC ---
  const renderCell = (enrollment, day) => {
    const key = `${enrollment.student_group_id}_${day}`;
    const record = data.attendance_data[key];
    const isCellActive =
      activeCell?.enrollmentId === enrollment.student_group_id &&
      activeCell?.date === day;

    const dayAsDayjs = dayjs(day);
    const joinedAt = dayjs(enrollment.joined_at);
    const archivedAt = enrollment.archived_at
      ? dayjs(enrollment.archived_at)
      : null;

    const isBeforeJoin = dayAsDayjs.isBefore(joinedAt, "day");
    const isAfterArchive = archivedAt && dayAsDayjs.isAfter(archivedAt, "day");
    const isFuture = dayAsDayjs.isAfter(dayjs(), "day");
    const isArchived = enrollment.is_archived;
    const iconClass = clsx("mx-auto", { "opacity-70": isArchived });

    if (isBeforeJoin) {
      return (
        <Tooltip title="Bu vaqtda hali guruhga qo'shilmagan" placement="top">
          <Minus
            size={16}
            className="text-gray-300 dark:text-gray-600 mx-auto"
          />
        </Tooltip>
      );
    }

    if (isAfterArchive) {
      return (
        <Tooltip title="Guruhdan chiqarilgan" placement="top">
          <Minus
            size={16}
            className="text-gray-300 dark:text-gray-600 mx-auto"
          />
        </Tooltip>
      );
    }

    if (isArchived) {
      if (record?.is_present === true) {
        return (
          <Tooltip
            title={`Keldi - ${dayjs(record.updated_at).format(
              "DD.MM.YYYY HH:mm"
            )}`}
            placement="top"
          >
            <Check size={16} className={clsx("text-green-500", iconClass)} />
          </Tooltip>
        );
      }

      if (record?.is_present === false) {
        if (record.comment) {
          return (
            <Tooltip
              title={`${record.comment} (${dayjs(record.updated_at).format(
                "DD.MM.YYYY HH:mm"
              )})`}
              placement="top"
            >
              <MessageSquareText
                size={16}
                className={clsx("text-red-600", iconClass)}
              />
            </Tooltip>
          );
        }
        return (
          <Tooltip
            title={`Kelmadi - ${dayjs(record.updated_at).format(
              "DD.MM.YYYY HH:mm"
            )}`}
            placement="top"
          >
            <X size={16} className={clsx("text-red-500", iconClass)} />
          </Tooltip>
        );
      }

      return (
        <Tooltip title="Belgilanmagan" placement="top">
          <Square size={16} className={clsx("text-gray-400", iconClass)} />
        </Tooltip>
      );
    }

    if (isFuture) {
      return <Lock size={16} className="text-gray-400 mx-auto" />;
    }

    // --- Default (editable) mode ---
    let StatusIcon = <Square size={16} className="text-gray-300" />;
    let tooltipTitle = "Belgilanmagan";

    if (record) {
      if (record.is_present) {
        StatusIcon = (
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check size={16} className="text-green-600" />
          </div>
        );
        tooltipTitle = `Keldi - ${dayjs(record.updated_at).format(
          "DD.MM.YYYY HH:mm"
        )}`;
      } else if (record.comment) {
        StatusIcon = (
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <MessageSquareText size={16} className="text-red-600" />
          </div>
        );
        tooltipTitle = `${record.comment} (${dayjs(record.updated_at).format(
          "DD.MM.YYYY HH:mm"
        )})`;
      } else {
        StatusIcon = (
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <X size={16} className="text-red-600" />
          </div>
        );
        tooltipTitle = `Kelmadi - ${dayjs(record.updated_at).format(
          "DD.MM.YYYY HH:mm"
        )}`;
      }
    }

    return (
      <Tooltip title={tooltipTitle} placement="top">
        <div
          className="relative flex justify-center items-center h-full w-full cursor-pointer"
          onClick={() =>
            setActiveCell({
              enrollmentId: enrollment.student_group_id,
              date: day,
            })
          }
        >
          {isCellActive ? (
            <AttendanceActionPopup
              onSelect={onActionSelect}
              onClose={() => setActiveCell(null)}
            />
          ) : (
            StatusIcon
          )}
        </div>
      </Tooltip>
    );
  };

  // Generate the list of months for the tabs
  const monthTabs = [];
  let monthIterator = dayjs(group.start_date).startOf("month");
  const end = dayjs(group.end_date).startOf("month");

  while (monthIterator.isSame(end) || monthIterator.isBefore(end)) {
    monthTabs.push({
      year: monthIterator.year(),
      month: monthIterator.month(), // 0-based: 0 = Jan, 11 = Dec
    });
    monthIterator = monthIterator.add(1, "month");
  }

  const visibleEnrollments = useMemo(() => {
    return data.enrollments.filter((e) => !e.is_archived || showArchived);
  }, [data.enrollments, showArchived]);

  const formatPhoneNumber = (n) => {
    const p = n.toString();
    return `+${p.slice(0, 3)} (${p.slice(3, 5)}) ${p.slice(5, 8)}-${p.slice(
      8,
      10
    )}-${p.slice(10, 12)}`;
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-sm p-4 space-y-4">
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            maxWidth: { xs: 320, sm: 480, lg: 1280 },
          }}
        >
          <Tabs
            value={`${view.year}-${view.month}`}
            onChange={(e, val) => {
              const [yearStr, monthStr] = val.split("-");
              setView({
                year: Number(yearStr),
                month: Number(monthStr),
              });
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {monthTabs.map((tab) => (
              <Tab
                key={`${tab.year}-${tab.month}`}
                label={dayjs()
                  .year(tab.year)
                  .month(tab.month)
                  .locale("uz-latn")
                  .format("MMMM YYYY")}
                value={`${tab.year}-${tab.month}`}
              />
            ))}
          </Tabs>
        </Box>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-tertiary">
                  <th className="sticky left-0 p-3 text-left w-48 bg-gray-50 dark:bg-dark-tertiary z-10">
                    O'quvchilar
                  </th>
                  {data.lesson_days.map((day) => (
                    <th key={day} className="p-3 text-center">
                      <Tooltip
                        title={`${dayjs(day).format("D-MMMM")}`}
                        placement="right"
                      >
                        <span className="cursor-pointer hover:text-blue-600">
                          {dayjs(day).format("DD")}
                        </span>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEnrollments.map((enrollment) => (
                  <tr
                    key={enrollment.student_group_id}
                    className="border-b dark:border-dark-tertiary"
                  >
                    <td className="sticky left-0 p-3 font-medium bg-white dark:bg-dark-secondary z-10">
                      <Tooltip
                        title={`${enrollment.student_name} ${formatPhoneNumber(
                          enrollment.student_phone_number
                        )} ${
                          enrollment.is_archived
                            ? dayjs(enrollment.archived_at).format("DD/MM/YYYY")
                            : ""
                        }`}
                        placement="right"
                      >
                        <span className="cursor-pointer hover:text-blue-600">
                          {enrollment.student_name}{" "}
                          {enrollment.is_archived && (
                            <span className="text-red-600">( ARXIV )</span>
                          )}
                        </span>
                      </Tooltip>
                    </td>
                    {data.lesson_days.map((day) => (
                      <td
                        key={day}
                        className="p-0 text-center h-14 w-14 border-l dark:border-dark-tertiary"
                      >
                        {renderCell(enrollment, day)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-red-500 text-sm font-medium hover:underline"
          >
            {showArchived
              ? "Arxivdagi o'quvchilarni yashirish"
              : "Arxivdagi o'quvchilarni ko'rish"}
          </button>
        </div>
      </div>
      <CommentModal
        isOpen={commentModal.isOpen}
        studentName={commentModal.studentName}
        lessonDate={commentModal.record?.date}
        onClose={() =>
          setCommentModal({ isOpen: false, record: null, studentName: "" })
        }
        onSubmit={(comment) =>
          handleAttendanceChange(
            commentModal.record.enrollmentId,
            commentModal.record.date,
            false,
            comment || ""
          )
        }
      />
    </ThemeProvider>
  );
};

export default AttendanceTab;
