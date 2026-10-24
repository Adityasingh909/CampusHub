import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Camera,
  Trash2,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { ProfileSkeleton } from "../../components/ui/Skeleton";

export function TeacherProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        setError("");

        const data = await api().get("/profile");
        if (cancelled) return;

        const saved = data?.profile || {};

        setPhone(saved.phone || "");
        setBio(saved.bio || "");
        setAvatarPreview(saved.avatar || null);

        if (typeof updateUser === "function") {
          updateUser({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            avatar: saved.avatar ?? null,
            phone: saved.phone ?? null,
            bio: saved.bio ?? null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load faculty profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, updateUser]);

  function handleImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.show("Please select a valid image file (PNG, JPG, or WEBP).", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show("Avatar image must be smaller than 2 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setIsDirty(true);
    };
    reader.onerror = () => {
      toast.show("Could not read the selected image.", "error");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    setIsDirty(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await api().put("/profile", {
        phone: phone.trim(),
        bio: bio.trim(),
        avatar: avatarPreview,
      });

      const saved = res?.profile || {};

      if (typeof updateUser === "function") {
        updateUser({
          avatar: saved.avatar ?? avatarPreview ?? null,
          phone: saved.phone ?? phone.trim(),
          bio: saved.bio ?? bio.trim(),
        });
      }

      setIsDirty(false);
      toast.show("Faculty profile updated successfully!", "success");
    } catch (err) {
      toast.show(err.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  }

  const teacherName = user?.name?.trim() || "Faculty Member";
  const teacherEmail = user?.email || "";
  const initials = teacherName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FC";

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-ink">Failed to Load Profile</h3>
        <p className="text-sm text-muted mt-1 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition inline-flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 max-w-4xl mx-auto">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
          <Link to="/teacher/dashboard" className="hover:text-navy transition-colors">
            Faculty Portal
          </Link>
          <span>/</span>
          <span className="text-ink">Profile Settings</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Faculty Profile &amp; Account
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage your institutional identity, contact information, and public avatar.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-2xl border border-line bg-white shadow-card p-6 sm:p-8 flex flex-col gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-navy text-white flex items-center justify-center text-2xl font-bold overflow-hidden shadow-card border-2 border-line">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={teacherName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-orange hover:bg-orange-hover text-white shadow-md transition-colors"
              title="Upload new photo"
            >
              <Camera size={14} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1 flex-1">
            <h2 className="font-display text-xl font-bold text-ink">
              {teacherName}
            </h2>
            <p className="text-xs text-muted font-medium">{teacherEmail}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-navy/10 text-navy uppercase tracking-wider">
                Faculty / Instructor
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Verified
              </span>
            </div>

            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} />
                <span>Remove Avatar</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-navy" />
                Full Name (Institutional)
              </label>
              <input
                type="text"
                disabled
                value={teacherName}
                className="w-full rounded-xl border border-line bg-slate-50 p-2.5 text-sm text-ink outline-none cursor-not-allowed opacity-80"
              />
              <span className="text-[11px] text-muted mt-1 block">
                Managed by campus administration.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-navy" />
                Institutional Email
              </label>
              <input
                type="email"
                disabled
                value={teacherEmail}
                className="w-full rounded-xl border border-line bg-slate-50 p-2.5 text-sm text-ink outline-none cursor-not-allowed opacity-80"
              />
              <span className="text-[11px] text-muted mt-1 block">
                Official login address.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
              <Phone size={14} className="text-navy" />
              Contact Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. +1 (555) 019-2834"
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-navy" />
              Bio &amp; Academic Overview
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Share your academic specialization, office hours notes, or research background..."
              className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink outline-none focus:border-navy focus:bg-white transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-muted">
              {isDirty ? (
                <span className="text-orange font-semibold">Unsaved changes</span>
              ) : (
                "All changes synced."
              )}
            </span>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
