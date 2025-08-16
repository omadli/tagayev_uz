import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  Edit,
  Trash2,
  MessageSquare,
  UserPlus,
  DollarSign,
  Archive,
  User,
  Calendar,
  Home,
  Phone,
  UserCog,
  Badge,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../../context/AuthContext";
import useWindowSize from "../../../hooks/useWindowSize";
import {
  Avatar,
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
import { stringAvatar } from "../../ui/Avatar";

const formatPhoneNumber = (n) => {
  const p = n.toString();
  return `+${p.slice(0, 3)} (${p.slice(3, 5)}) ${p.slice(5, 8)}-${p.slice(
    8,
    10
  )}-${p.slice(10, 12)}`;
};

// Reusable component for displaying a row of information
const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start text-sm">
    <Icon
      size={16}
      className="text-gray-500 dark:text-text-light-secondary mr-3 mt-0.5 flex-shrink-0"
    />
    <div className="flex flex-wrap items-center">
      <span className="font-medium text-gray-600 dark:text-text-light-secondary mr-2">
        {label}:
      </span>
      <div className="font-semibold text-gray-800 dark:text-text-light-primary">
        {children}
      </div>
    </div>
  </div>
);

const StudentInfoPanel = ({
  student,
  onEdit,
  onDelete,
  onArchive,
  onEnroll,
  onAddPayment,
  onSendMessage,
}) => {
  const { user: currentUser } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width < 1024;
  const isManager =
    currentUser.roles.includes("Admin") || currentUser.roles.includes("CEO");

  const hasActiveGroup = student.groups.length > 0;

  // Helper function for formatting dates
  const formatDate = (dateStr) =>
    dateStr ? dayjs(dateStr).format("DD/MM/YYYY") : "Kiritilmagan";

  const formatCurrency = (num) =>
    new Intl.NumberFormat("fr-FR").format(num || 0) + " so'm";

  // --- JSX for the detailed student info ---
  const StudentDetails = () => (
    <div className="space-y-3">
      <InfoRow icon={Phone} label="Telefon raqam">
        {formatPhoneNumber(student.phone_number)}
      </InfoRow>
      <InfoRow icon={Calendar} label="Tug'ilgan sana">
        {formatDate(student.birth_date)}
      </InfoRow>
      <InfoRow icon={UserCog} label="Jinsi">
        <span className="capitalize">
          {student.gender === "male" ? "Erkak" : "Ayol"}
        </span>
      </InfoRow>
      <InfoRow icon={Home} label="Filial">
        <Chip label={student.branch_name} size="small" variant="outlined" />
      </InfoRow>
      <InfoRow icon={ShieldCheck} label="Holati">
        <span
          className={clsx(
            "px-2 py-0.5 rounded-md text-xs font-semibold",
            hasActiveGroup
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          )}
        >
          {hasActiveGroup ? "Faol" : "Guruhsiz"}
        </span>
      </InfoRow>
      <InfoRow icon={Wallet} label="Umumiy balansi">
        <span className={clsx(student.balance < 0 && "text-red-500")}>
          {formatCurrency(student.balance)}
        </span>
      </InfoRow>
      <InfoRow icon={Info} label="Izoh">
        {student.comment || "Bo'sh"}
      </InfoRow>
    </div>
  );

  // --- JSX for the action buttons ---
  const ActionButtons = () =>
    isManager && (
      <>
        <Divider className="!my-4" />
        <div className="flex items-center justify-around flex-wrap">
          <Tooltip title="Guruhga Qo'shish">
            <IconButton onClick={onEnroll} color="success">
              <UserPlus size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xabar Yuborish" color="primary">
            <IconButton onClick={onSendMessage}>
              <MessageSquare size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="To'lov Qo'shish" color="secondary">
            <IconButton onClick={onAddPayment}>
              <DollarSign size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tahrirlash">
            <IconButton onClick={onEdit} color="info">
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={student.is_archived ? "Arxivdan chiqarish" : "Arxivlash"}
          >
            <IconButton onClick={onArchive} color="warning">
              {student.is_archived ? (
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
        to="/students"
        className="inline-flex items-center text-sm text-blue-600 hover:underline mb-2"
      >
        <ChevronLeft size={16} className="mr-1" /> O'quvchilar ro'yxatiga
        qaytish
      </Link>

      {isMobile ? (
        // --- MOBILE VIEW: Collapsible Accordion ---
        <Accordion
          defaultExpanded
          className="!bg-white dark:!bg-dark-secondary !rounded-xl !shadow-sm"
        >
          <AccordionSummary
            expandIcon={<ChevronDown size={20} />}
            className="!font-bold"
          >
            <div className="flex items-center space-x-3">
              {student.profile_photo ? (
                <Avatar
                  alt={student.full_name}
                  src={student.profile_photo}
                  sx={{ width: 56, height: 56, fontSize: "3rem" }}
                />
              ) : (
                <Avatar
                  {...stringAvatar(student.full_name, {
                    width: 56,
                    height: 56,
                    fontSize: "1.5rem",
                  })}
                />
              )}
              <h2 className="text-xl font-bold">{student.full_name}</h2>
            </div>
          </AccordionSummary>
          <AccordionDetails className="!p-5 !pt-0 space-y-4">
            <Divider />
            <StudentDetails />
            <ActionButtons />
          </AccordionDetails>
        </Accordion>
      ) : (
        // --- DESKTOP VIEW: Static Info Panel ---
        <div className="bg-white dark:bg-dark-secondary p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col items-center text-center">
            {student.profile_photo ? (
              <Avatar
                alt={student.full_name}
                src={student.profile_photo}
                sx={{ width: 102, height: 102, fontSize: "3rem" }}
              />
            ) : (
              <Avatar
                {...stringAvatar(student.full_name, {
                  width: 102,
                  height: 102,
                  fontSize: "3rem",
                })}
              />
            )}
            <h2 className="text-2xl font-bold">{student.full_name}</h2>
          </div>
          <Divider />
          <StudentDetails />
          <ActionButtons />
        </div>
      )}
    </div>
  );
};

export default StudentInfoPanel;
