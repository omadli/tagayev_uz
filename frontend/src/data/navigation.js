import {
  Home, // Bosh sahifa
  ClipboardList, // Lidlar
  Layers, // Guruhlar
  Settings, // Sozlamalar
  FileText, // Hisobotlar
  Briefcase, // Xodimlar
  DollarSign, // To'lovlar
  UserCheck, // Davomat
} from "lucide-react";
import {
  FaChartLine, // Moliya
  FaUserGraduate, // O'quvchilar
  FaChalkboardTeacher, // O'qituvchilar
} from "react-icons/fa";

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
      { name: "CRM Sozlamalari", icon: Settings, path: "/settings/crm" },
      { name: "Xodimlar", icon: Briefcase, path: "/staff" },
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
