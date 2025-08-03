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
  { name: "Bosh sahifa", icon: Home, path: "/" }, // No roles = public for all logged-in users
  { name: "Guruhlarim", icon: Layers, path: "/mygroups", allowedRoles: ['Teacher',] },
  { name: "O'quvchilarim", icon: FaUserGraduate, path: "/my-students", allowedRoles: ['Teacher',] },

  { name: "Lidlar", icon: ClipboardList, path: "/leads", allowedRoles: ['Admin', 'CEO'] },
  { name: "O'qituvchilar", icon: FaChalkboardTeacher, path: "/teachers", allowedRoles: ['Admin', 'CEO'] },
  { name: "Xodimlar", icon: Briefcase, path: "/staff", allowedRoles: ['CEO']  },
  { name: "Guruhlar", icon: Layers, path: "/groups", allowedRoles: ['Admin', 'CEO'] },
  { name: "O'quvchilar", icon: FaUserGraduate, path: "/students", allowedRoles: ['Admin', 'CEO'] },
  {
    name: "Sozlamalar",
    icon: Settings,
    allowedRoles: ['CEO'],
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
  { name: "Moliya", icon: FaChartLine, path: "/finance" , allowedRoles: ['Admin', 'CEO'], },
  {
    name: "Hisobotlar",
    allowedRoles: ['Admin', 'CEO'],
    icon: FileText,
    children: [
      { name: "Davomat", icon: UserCheck, path: "/reports/attendance" },
      { name: "To'lovlar", icon: DollarSign, path: "/reports/payments" },
    ],
  },
];
