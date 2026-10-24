import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { LoginPage } from "../features/auth/LoginPage";
import { OtpPage } from "../features/auth/OtpPage";
import { SignupPage } from "../features/auth/SignupPage";
import { AssignmentDetailPage } from "../features/assignments/AssignmentDetailPage";
import { AssignmentsPage } from "../features/assignments/AssignmentsPage";
import { TeacherAssignmentsPage } from "../features/assignments/TeacherAssignmentsPage";
import { CourseDetailPage } from "../features/courses/CourseDetailPage";
import { CoursesPage } from "../features/courses/CoursesPage";
import { TeacherCoursesPage } from "../features/courses/TeacherCoursesPage";
import { StudentDashboardPage } from "../features/dashboard/StudentDashboardPage";
import { TeacherDashboardPage } from "../features/dashboard/TeacherDashboardPage";
import { TeacherSubmissionsPage } from "../features/submissions/TeacherSubmissionsPage";
import { QuizAttemptPage } from "../features/quizzes/QuizAttemptPage";
import { QuizzesPage } from "../features/quizzes/QuizzesPage";
import { StudentProfilePage } from "../features/profile/StudentProfilePage";
import { TeacherProfilePage } from "../features/profile/TeacherProfilePage";
import { PrivateUploadsPage } from "../features/uploads/PrivateUploadsPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ProtectedRoute } from "../components/ProtectedRoute";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<OtpPage />} />

      <Route element={
        <ProtectedRoute role="student">
      <DashboardLayout role="student" />
    </ProtectedRoute>
        }>
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/courses" element={<CoursesPage />} />
        <Route path="/student/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/student/assignments" element={<AssignmentsPage />} />
        <Route
          path="/student/assignments/:assignmentId"
          element={<AssignmentDetailPage />}
        />
        <Route path="/student/quizzes" element={<QuizzesPage />} />
        <Route path="/student/quizzes/:quizId" element={<QuizAttemptPage />} />
        <Route path="/student/uploads" element={<PrivateUploadsPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        <Route
          path="/student/notifications"
          element={
            <PlaceholderPage
              title="Notifications"
              description="Alerts and deadline reminders will use the same CampusHub shell."
            />
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute role="teacher">
            <DashboardLayout role="teacher" />
          </ProtectedRoute>
        }
      >
        <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
        <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
        <Route path="/teacher/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
        <Route
          path="/teacher/assignments/:assignmentId"
          element={<TeacherSubmissionsPage />}
        />
        <Route
          path="/teacher/assignments/:assignmentId/submissions"
          element={<TeacherSubmissionsPage />}
        />
        <Route path="/teacher/submissions" element={<TeacherSubmissionsPage />} />
        <Route
          path="/teacher/submissions/:submissionId"
          element={<TeacherSubmissionsPage />}
        />
        <Route
          path="/teacher/quizzes"
          element={
            <PlaceholderPage
              title="Quiz management"
              description="Quiz results overview will be implemented in Phase 7."
            />
          }
        />
        <Route
          path="/teacher/uploads"
          element={<Navigate to="/teacher/dashboard" replace />}
        />
        <Route
          path="/teacher/profile"
          element={<TeacherProfilePage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
