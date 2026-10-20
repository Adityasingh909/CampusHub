import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { LoginPage } from "../features/auth/LoginPage";
import { OtpPage } from "../features/auth/OtpPage";
import { SignupPage } from "../features/auth/SignupPage";
import { AssignmentDetailPage } from "../features/assignments/AssignmentDetailPage";
import { AssignmentsPage } from "../features/assignments/AssignmentsPage";
import { CourseDetailPage } from "../features/courses/CourseDetailPage";
import { CoursesPage } from "../features/courses/CoursesPage";
import { StudentDashboardPage } from "../features/dashboard/StudentDashboardPage";
import { QuizAttemptPage } from "../features/quizzes/QuizAttemptPage";
import { QuizzesPage } from "../features/quizzes/QuizzesPage";
import { StudentProfilePage } from "../features/profile/StudentProfilePage";
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

      <Route element={ <ProtectedRoute role="student">
      <DashboardLayout role="student" />
    </ProtectedRoute>}>
        <Route
          path="/teacher/dashboard"
          element={
            <PlaceholderPage
              title="Teacher dashboard"
              description="Faculty metrics and pending grading will be implemented in Phase 7."
            />
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <PlaceholderPage
              title="Manage courses"
              description="Course create and edit flows will be implemented in Phase 7."
            />
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <PlaceholderPage
              title="Assignment management"
              description="Create, edit, and publish assignments in Phase 7."
            />
          }
        />
        <Route
          path="/teacher/submissions"
          element={
            <PlaceholderPage
              title="Submissions & grading"
              description="Review, grade, and feedback screens will be implemented in Phase 7."
            />
          }
        />
        <Route
          path="/teacher/submissions/:submissionId"
          element={
            <PlaceholderPage
              title="Submission review"
              description="File preview, marks, and comments will be implemented in Phase 7."
            />
          }
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
          element={
            <PlaceholderPage
              title="Private uploads"
              description="Faculty file storage will share the uploads component from Phase 6."
            />
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <PlaceholderPage
              title="Profile"
              description="Faculty account settings will reuse the profile layout."
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
