import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileQuestion,
  CloudUpload,
  UserRound,
  FolderKanban,
  FileCheck2,
  Bell,
} from "lucide-react";

export const studentNav = [
  { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Courses", to: "/student/courses", icon: BookOpen },
  { label: "Assignments", to: "/student/assignments", icon: ClipboardList },
  { label: "Quizzes", to: "/student/quizzes", icon: FileQuestion },
  { label: "Private Uploads", to: "/student/uploads", icon: CloudUpload },
  { label: "Profile", to: "/student/profile", icon: UserRound },
];

export const studentMobileNav = [
  { label: "Home", to: "/student/dashboard", icon: LayoutDashboard },
  { label: "Courses", to: "/student/courses", icon: BookOpen },
  { label: "Tasks", to: "/student/assignments", icon: ClipboardList },
  { label: "Alerts", to: "/student/notifications", icon: Bell },
];

export const teacherNav = [
  { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Manage Courses", to: "/teacher/courses", icon: FolderKanban },
  { label: "Assignments", to: "/teacher/assignments", icon: ClipboardList },
  {
    label: "Submissions & Grading",
    to: "/teacher/submissions",
    icon: FileCheck2,
    badge: 14,
  },
  { label: "Quiz Management", to: "/teacher/quizzes", icon: FileQuestion },
  { label: "Private Uploads", to: "/teacher/uploads", icon: CloudUpload },
  { label: "Profile", to: "/teacher/profile", icon: UserRound },
];

export const currentUsers = {
  student: {
    name: "Aditya Sharma",
    subtitle: "Computer Science & Eng",
    role: "student",
    initials: "AS",
  },
  teacher: {
    name: "Prof. Rahul Sharma",
    subtitle: "Faculty / Instructor",
    role: "teacher",
    initials: "RS",
  },
};
