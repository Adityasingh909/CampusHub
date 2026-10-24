import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Megaphone,
  Plus,
  AlertTriangle,
  Clock,
  User,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { AnnouncementCardSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../hooks/useToast";
import {
  getCourseAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/announcementService";

function formatAnnouncementDate(isoString) {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(isoString);
  }
}

export function CourseAnnouncementsTab({
  course,
  isTeacher = false,
  onCountChange,
}) {
  const toast = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Form modal state (Create & Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "NORMAL",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load announcements from API
  useEffect(() => {
    let cancelled = false;

    async function fetchAnnouncements() {
      if (!course?.id) return;

      try {
        setLoading(true);
        setError("");

        const res = await getCourseAnnouncements(course.id);
        if (cancelled) return;

        // Safely extract list from various response shapes:
        // { success: true, announcements: [...] }, { data: [...] }, or [...]
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (Array.isArray(res?.announcements)) {
          list = res.announcements;
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        }

        setAnnouncements(list);
        if (typeof onCountChange === "function") {
          onCountChange(list.length);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Failed to load course announcements. Please verify backend endpoint is available."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [course?.id, reloadKey, onCountChange]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // Open Create Modal
  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      title: "",
      message: "",
      priority: "NORMAL",
    });
    setFormErrors({});
    setSubmitError("");
    setModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(announcement) {
    setEditingItem(announcement);
    setFormData({
      title: announcement.title || "",
      message: announcement.message || announcement.content || "",
      priority:
        String(announcement.priority).toUpperCase() === "IMPORTANT"
          ? "IMPORTANT"
          : "NORMAL",
    });
    setFormErrors({});
    setSubmitError("");
    setModalOpen(true);
  }

  // Open Delete Dialog
  function handleOpenDelete(announcement) {
    setItemToDelete(announcement);
    setDeleteModalOpen(true);
  }

  // Submit Create or Edit Form
  async function handleSubmitForm(e) {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Announcement title is required.";
    }
    if (!formData.message.trim()) {
      errors.message = "Announcement message content is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
      };

      if (editingItem?.id) {
        // Update existing announcement
        await updateAnnouncement(editingItem.id, payload);
        toast.show("Announcement updated successfully!", "success");
      } else {
        // Create new announcement
        await createAnnouncement(course.id, payload);
        toast.show("Announcement published successfully!", "success");
      }

      setModalOpen(false);
      setEditingItem(null);
      setFormData({ title: "", message: "", priority: "NORMAL" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSubmitError(
        err.message || "Failed to save announcement. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Confirm Delete
  async function handleConfirmDelete() {
    if (!itemToDelete?.id) return;

    try {
      setDeleting(true);
      await deleteAnnouncement(itemToDelete.id);
      toast.show("Announcement deleted successfully.", "success");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.show(
        err.message || "Failed to delete announcement. Please try again.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  const defaultAuthor = useMemo(() => {
    return (
      course?.teacher?.name ||
      course?.instructor ||
      "Course Instructor"
    );
  }, [course]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
            Course Announcements
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Announcements for {course?.title || "the current course"}.
          </p>
        </div>

        {/* Teacher Action: Create Button */}
        {isTeacher && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="flex flex-col gap-4">
          <AnnouncementCardSkeleton />
          <AnnouncementCardSkeleton />
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-xl mx-auto my-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-base font-bold text-ink">Failed to Load Announcements</h4>
          <p className="text-xs sm:text-sm text-muted mt-1 mb-4 leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition inline-flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && announcements.length === 0 && (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-card flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-orange/10 text-orange flex items-center justify-center mb-3">
            <Megaphone size={28} />
          </div>
          <h4 className="font-display text-lg font-bold text-ink">
            No announcements have been posted yet.
          </h4>
          <p className="text-sm text-muted max-w-md mt-1 leading-relaxed">
            {isTeacher
              ? "Share important updates, upcoming exam reminders, or assignment pointers with your enrolled students."
              : "Your instructor has not published any announcements for this course yet. Check back later for updates."}
          </p>

          {isTeacher && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-5 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Create Announcement</span>
            </button>
          )}
        </div>
      )}

      {/* Announcements List */}
      {!loading && !error && announcements.length > 0 && (
        <div className="flex flex-col gap-4">
          {announcements.map((item, index) => {
            const isImportant =
              String(item.priority || "").toUpperCase() === "IMPORTANT";
            const authorName =
              item.author?.name ||
              item.author ||
              item.teacher?.name ||
              item.instructor ||
              defaultAuthor;
            const formattedDate = formatAnnouncementDate(
              item.createdAt || item.date
            );

            return (
              <div
                key={item.id ?? index}
                className="group flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-card hover:shadow-lift transition-all"
              >
                {/* Header Row: Title, Priority, Teacher Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone size={18} />
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isImportant ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange/15 text-orange flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Important
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-muted">
                            Normal Priority
                          </span>
                        )}
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock size={12} />
                          {formattedDate}
                        </span>
                      </div>

                      <h4 className="font-display text-base sm:text-lg font-bold text-ink">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Teacher Action Buttons (Edit / Delete) */}
                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-xl text-muted hover:text-navy hover:bg-canvas transition-colors"
                        title="Edit announcement"
                        aria-label="Edit announcement"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(item)}
                        className="p-2 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete announcement"
                        aria-label="Delete announcement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <p className="text-sm leading-relaxed text-ink whitespace-pre-line pl-0 sm:pl-13">
                  {item.message || item.content}
                </p>

                {/* Footer Info: Author */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-muted pl-0 sm:pl-13">
                  <div className="flex items-center gap-2 font-medium">
                    <div className="w-5 h-5 rounded-full bg-navy/10 text-navy flex items-center justify-center text-[10px] font-bold">
                      <User size={12} />
                    </div>
                    <span>{authorName}</span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Posted to {course?.code || "Course"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => !submitting && setModalOpen(false)}
          title={
            editingItem ? "Edit Course Announcement" : "Create Course Announcement"
          }
        >
          <form onSubmit={handleSubmitForm} className="flex flex-col gap-4 pt-2">
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{submitError}</span>
              </div>
            )}

            {/* Title Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink">
                Announcement Title <span className="text-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                  if (formErrors.title) {
                    setFormErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                placeholder="e.g. Midterm Exam Guidelines & Schedule"
                className={`h-10 rounded-xl border bg-canvas px-3 text-sm text-ink outline-none transition focus:bg-white focus:ring-[3px] ${
                  formErrors.title
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-line focus:border-navy focus:ring-navy/15"
                }`}
              />
              {formErrors.title && (
                <span className="text-[11px] text-red-600 font-medium">
                  {formErrors.title}
                </span>
              )}
            </div>

            {/* Priority Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, priority: "NORMAL" }))
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    formData.priority === "NORMAL"
                      ? "border-navy bg-navy/5 text-navy font-bold shadow-xs"
                      : "border-line bg-canvas text-muted hover:text-ink"
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Normal</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, priority: "IMPORTANT" }))
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    formData.priority === "IMPORTANT"
                      ? "border-orange bg-orange/10 text-orange font-bold shadow-xs"
                      : "border-line bg-canvas text-muted hover:text-ink"
                  }`}
                >
                  <AlertTriangle size={14} />
                  <span>Important</span>
                </button>
              </div>
            </div>

            {/* Message Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink">
                Announcement Message <span className="text-orange">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.message}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, message: e.target.value }));
                  if (formErrors.message) {
                    setFormErrors((prev) => ({ ...prev, message: "" }));
                  }
                }}
                placeholder="Write the full announcement details and instructions for students..."
                className={`rounded-xl border bg-canvas p-3 text-sm text-ink outline-none transition focus:bg-white focus:ring-[3px] ${
                  formErrors.message
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-line focus:border-navy focus:ring-navy/15"
                }`}
              />
              {formErrors.message && (
                <span className="text-[11px] text-red-600 font-medium">
                  {formErrors.message}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>
                      {editingItem ? "Saving..." : "Publishing..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {editingItem ? "Save Changes" : "Publish Announcement"}
                  </span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          open={deleteModalOpen}
          onClose={() => !deleting && setDeleteModalOpen(false)}
          title="Delete Announcement"
        >
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-start gap-3 rounded-2xl bg-red-50/60 border border-red-100 p-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-ink">
                  Are you sure you want to delete this announcement?
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  &quot;{itemToDelete?.title}&quot; will be permanently deleted and no longer visible to enrolled students. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Announcement</span>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
