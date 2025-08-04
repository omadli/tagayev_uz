import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Edit,
  Trash2,
  MessageSquare,
  UserPlus,
  DollarSign,
  BookOpen,
  Users,
  Clock,
  DoorOpen,
  CalendarDays,
  UserCircle,
  CalendarRange,
  Building,
  MessageSquareMore,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import useWindowSize from "../../../hooks/useWindowSize";
import {
  Tooltip,
  IconButton,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { BiArchiveIn, BiArchiveOut } from "react-icons/bi";
import dayjs from "dayjs";

// Helper function for formatting weekdays consistently
const formatWeekdays = (weekdays) => {
  if (!weekdays) return "-";
  if (weekdays === "135") return "Toq kunlar";
  if (weekdays === "246") return "Juft kunlar";
  if (weekdays === "1234567") return "Har kuni";
  const map = {
    1: "Dush",
    2: "Sesh",
    3: "Chor",
    4: "Pay",
    5: "Jum",
    6: "Shan",
    7: "Yak",
  };
  return weekdays
    .split("")
    .map((day) => map[day] || "")
    .join("/");
};

// Reusable component for displaying a row of information
const InfoRow = ({ icon: Icon, label, value, valueColor, ...props }) => (
  <div className="flex items-center text-sm">
    <Icon
      size={16}
      className="text-gray-500 dark:text-text-light-secondary mr-3 flex-shrink-0"
    />
    <span className="font-medium text-gray-600 dark:text-text-light-secondary mr-2">
      {label}:
    </span>
    <div
      {...props}
      className={`font-semibold text-gray-800 dark:text-text-light-primary truncate ${
        valueColor || ""
      }`}
    >
      {value}
    </div>
  </div>
);

const GroupInfoPanel = ({
  group,
  onEdit,
  onDelete,
  onArchive,
  onAddStudent,
  onPriceChange,
  onSendMessage,
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { width } = useWindowSize(); // Get the current window width
  const isMobile = width < 1024; // lg breakpoint
  const isManager =
    currentUser.roles.includes("Admin") || currentUser.roles.includes("CEO");

  // Helper function for formatting dates with dayjs for consistency
  const formatDate = (dateStr) => dayjs(dateStr).format("DD/MM/YYYY");

  const GroupDetails = () => (
    <div className="space-y-3">
      <InfoRow
        icon={Users}
        label="O'quvchilar soni"
        value={`${group.students_list ? group.students_list.length : "0"} ta`}
      />
      <InfoRow
        icon={BookOpen}
        label="Guruh nomi"
        value={
          <Chip
            label={group.name}
            size="small"
            style={{
              backgroundColor: group.color,
              color: group.text_color,
            }}
          />
        }
      />
      <InfoRow
        icon={Clock}
        label="Dars vaqti"
        value={`${group.course_start_time.slice(
          0,
          5
        )} - ${group.course_end_time.slice(0, 5)}`}
      />
      <InfoRow
        icon={DoorOpen}
        label="Dars xonasi"
        value={group.room_name || "Belgilanmagan"}
      />
      <InfoRow
        icon={CalendarDays}
        label="Dars kunlar"
        value={formatWeekdays(group.weekdays)}
      />
      <InfoRow
        icon={UserCircle}
        label="O'qituvchi"
        value={
          <Chip
            label={group.teacher_name}
            sizze="small"
            variant="outlined"
            onClick={() => {
              navigate(`/teachers/${group.teacher_id}`);
            }}
          />
        }
        valueColor="text-blue-600"
      />
      <InfoRow
        icon={CalendarRange}
        label="Kurs davomiyligi"
        value={`${formatDate(group.start_date)} - ${formatDate(
          group.end_date
        )}`}
      />
      <InfoRow
        icon={Building}
        label="Filial"
        value={
          <Chip label={group.branch_name} size="small" variant="outlined" />
        }
      />
      <InfoRow
        icon={DollarSign}
        label="Kurs hozirgi narxi"
        value={`${new Intl.NumberFormat("fr-FR").format(
          group.current_price || 0
        )} so'm`}
      />
      <InfoRow
        icon={MessageSquareMore}
        label="Izoh"
        value={group.comment ? group.comment : "Bo'sh"}
      />
    </div>
  );

  const ActionButtons = () =>
    isManager && (
      <>
        <Divider />
        <div className="flex items-center justify-around">
          <Tooltip title="O'quvchi Qo'shish">
            <IconButton onClick={onAddStudent} color="success">
              <UserPlus size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xabar Yuborish">
            <IconButton onClick={onSendMessage} color="primary">
              <MessageSquare size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Narx O'zgartirish">
            <IconButton onClick={onPriceChange} color="secondary">
              <DollarSign size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tahrirlash">
            <IconButton onClick={onEdit} color="info">
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={group.is_archived ? "Arxivdan chiqarish" : "Arxivlash"}
          >
            <IconButton onClick={onArchive} color="warning">
              {group.is_archived ? (
                <BiArchiveOut size={20} />
              ) : (
                <BiArchiveIn size={20} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="O'chirish">
            <IconButton onClick={onDelete} color="error">
              <Trash2 size={18} />
            </IconButton>
          </Tooltip>
        </div>
      </>
    );

  return (
    <div className="w-full lg:w-1/3 xl:w-1/4 lg:pr-6 flex-shrink-0 space-y-4">
      <Link
        to="/groups"
        className="inline-flex items-center text-sm text-blue-600 hover:underline mb-2"
      >
        <ChevronLeft size={16} className="mr-1" /> Guruhlar ro'yxatiga qaytish
      </Link>

      {isMobile ? (
        <Accordion
          defaultExpanded
          className="!bg-white dark:!bg-dark-secondary !rounded-xl !shadow-sm"
        >
          <AccordionSummary
            expandIcon={<ChevronDown size={20} />}
            className="!font-bold"
          >
            <Typography>{group.name}</Typography>
          </AccordionSummary>
          <AccordionDetails className="!p-5 !pt-0 space-y-4">
            <Divider />
            <GroupDetails />
            <ActionButtons />
          </AccordionDetails>
        </Accordion>
      ) : (
        <div className="bg-white dark:bg-dark-secondary p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: group.color }}
            >
              <BookOpen size={24} style={{ color: group.text_color }} />
            </div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
          </div>
          <Divider />
          <GroupDetails />
          <ActionButtons />
        </div>
      )}
    </div>
  );
};

export default GroupInfoPanel;
