import {
  Users, // Faol Lidlar
  Box, // Guruhlar
  TrendingDown, // Qolgan qarzlar
  AlertTriangle, // Qarzdorlar
  Clock, // To'lovi yaqin
  UserCheck, // Faol o'quvchilar
  BookOpen, // Sinov darsida
  Repeat, // Kelib ketganlar
  Briefcase, // O'qituvchilar
} from "lucide-react";

import {
  FaUserGraduate, // O'quvchilar
  FaChalkboardTeacher, // O'qituvchilar
} from "react-icons/fa";

export const statsMapping = [
  {
    key: "active_leads",
    title: "Faol Lidlar",
    icon: Users,
    color: "bg-green-500",
    tooltip: "Hozirda faol bo'lgan lidlar ro'yxati.",
  },
  {
    key: "groups",
    title: "Guruhlar",
    icon: Box,
    color: "bg-orange-500",
    tooltip: "O'quv markazidagi mavjud guruhlar soni.",
  },
  {
    key: "remaining_debts",
    title: "Qolgan qarzlar",
    icon: TrendingDown,
    color: "bg-red-500",
    tooltip: "Umumiy o'quvchilarning qolgan qarzlari miqdori",
  },
  {
    key: "debtors",
    title: "Qarzdorlar",
    icon: AlertTriangle,
    color: "bg-red-600",
    tooltip: "Umumiy qarzdor o'quvchilar soni",
  },
  {
    key: "payment_due_soon",
    title: "To'lovi yaqin",
    icon: Clock,
    color: "bg-yellow-500",
    tooltip: "To'lov qilishiga 7 kundan kam qolgan o'quvchilar soni",
  },
  {
    key: "active_students",
    title: "Faol o'quvchilar",
    icon: UserCheck,
    color: "bg-teal-500",
    tooltip: "Ayni vaqtda faol o'quvchilar soni",
  },
  {
    key: "attrition_students",
    title: "Kelib ketganlar",
    icon: Repeat,
    color: "bg-purple-500",
    tooltip: "Sinov darsiga kelib ketgan o'quvchilar soni",
  },
  {
    key: "teachers",
    title: "O'qituvchilar",
    icon: FaChalkboardTeacher,
    color: "bg-blue-500",
    tooltip: "Markazdagi faol o'qituvchilar soni.",
  },
  {
    key: "admins",
    title: "Adminlar",
    icon: Briefcase,
    color: "bg-indigo-500",
    tooltip: "Markazdagi faol administratorlar soni.",
  },
];
