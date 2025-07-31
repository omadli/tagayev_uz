import {
  Home, // Bosh sahifa
  ClipboardList, // Lidlar
  Layers, // Guruhlar
  Settings, // Sozlamalar
  FileText, // Hisobotlar
  Briefcase, // Xodimlar
  DollarSign, // To'lovlar
  UserCheck, // Davomat
  DoorOpen, // Xonalar (Rooms)
  BookCopy, // Kurslar (Courses)
} from "lucide-react";
import {
  FaChartLine, // Moliya
  FaUserGraduate, // O'quvchilar
  FaChalkboardTeacher, // O'qituvchilar
  FaBuilding, // Office
  FaSms, // SMS,
  FaUsersCog, // CEO,
  FaHistory, // Harakatlar tarixi
  FaSitemap, // Fliallar
  FaRobot, // Bot xabarnoma
  FaDollarSign, // To'lovlar
  FaWallet,  // To'lov turlari
  FaWhmcs, // Asosiy sozlamalar
  FaUserSecret, // Tizimga kirishlar
} from "react-icons/fa";
import { SiSimplelogin } from "react-icons/si"; // Yuborilgan SMS lar

export const navLinks = [
  { name: "Bosh sahifa", icon: Home, path: "/" },
  { name: "Lidlar", icon: ClipboardList, path: "/leads" },
  { name: "O'qituvchilar", icon: FaChalkboardTeacher, path: "/teachers" },
  { name: "Xodimlar", icon: Briefcase, path: "/staff" },
  { name: "Guruhlar", icon: Layers, path: "/groups" },
  { name: "O'quvchilar", icon: FaUserGraduate, path: "/students" },
  {
    name: "Sozlamalar",
    icon: Settings,
    children: [
      {
        name: "Asosiy sozlamalar",
        icon: FaWhmcs,
        children: [
          {
            name: "Fliallar",
            icon: FaSitemap,
            path: "/settings/office/branches",
          },
          { name: "Xonalar", icon: DoorOpen, path: "/settings/office/rooms" },
          { name: "To'lov turlari", icon: FaWallet, path: "/settings/office/payment-types" },
        ],
      },
      { name: "CEO", icon: FaUsersCog, path: "/settings/ceo" },
      { name: "SMS Sozlamalari", icon: FaSms, path: "/settings/sms" },
      {
        name: "Harakatlar tarixi",
        icon: FaHistory,
        children: [
          {
            name: "To'lovlar",
            icon: FaDollarSign,
            path: "/settings/logs/payments",
          },
          {
            name: "Tizimga kirishlar",
            icon: FaUserSecret,
            path: "/settings/logs/logins",
          },
          {
            name: "Bot xabarnoma",
            icon: FaRobot,
            path: "/settings/logs/bot-notification",
          },
          {
            name: "Yuborilgan SMS lar",
            icon: SiSimplelogin,
            path: "/settings/logs/sms",
          },
        ],
      },
    ],
  },
  { name: "Moliya", icon: FaChartLine, path: "/finance" },
  {
    name: "Hisobotlar",
    icon: FileText,
    children: [
      { name: "Davomat", icon: UserCheck, path: "/reports/attendance" },
      { name: "To'lovlar", icon: DollarSign, path: "/reports/payments" },
    ],
  },
];
