import {useState,useMemo,useRef,useContext,useEffect,useCallback,} from "react";
import { Link } from "react-router-dom";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Trash2,
  CheckCircle2,
  Lock,
  ChevronRight,
  Save,
  Check,
  Loader2,
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { ProfileSkeleton } from "../../components/ui/Skeleton";

export function StudentProfilePage() {
  const apiClient = useMemo(() => api(), []);
  const { user, updateUser } = useContext(AuthContext);
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [bio, setBio] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Load the authenticated user's profile from the backend.
  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const data = await apiClient.get("/profile");
      const saved = data.profile ?? {};

      setProfile({
        ...saved,
        name: data.name ?? "",
        email: data.email ?? "",
        role: data.role ?? "",
      });

      setFullName(data.name ?? "");
      setPhone(saved.phone ?? "");
      setDob(
        saved.dob
          ? new Date(saved.dob).toISOString().slice(0, 10)
          : ""
      );
      setGender(saved.gender ?? "");
      setBloodGroup(saved.bloodGroup ?? "");
      setBio(saved.bio ?? "");
      setAvatarPreview(saved.avatar ?? null);

      setStreet(saved.street ?? "");
      setCity(saved.city ?? "");
      setState(saved.state ?? "");
      setPincode(saved.pincode ?? "");
      setEmergencyName(saved.emergencyContactName ?? "");
      setEmergencyPhone(saved.emergencyPhone ?? "");

      setIsDirty(false);
    } catch (error) {
      toast.show(
        error.message || "Failed to load your profile.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [apiClient, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Calculate completion from the form values.
  const completionPercentage = useMemo(() => {
    const required = [
      fullName,
      phone,
      dob,
      street,
      city,
      state,
      emergencyName,
      emergencyPhone,
    ];

    const filled = required.filter(
      (value) => value.trim().length > 0
    ).length;

    return Math.round((filled / required.length) * 100);
  }, [
    fullName,
    phone,
    dob,
    street,
    city,
    state,
    emergencyName,
    emergencyPhone,
  ]);

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.show("Please select a valid image.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show("Image must be smaller than 2 MB.", "error");
      event.target.value = "";
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

  async function handleSaveProfile(event) {
    event?.preventDefault();

    if (!fullName.trim()) {
      toast.show("Full name is required.", "error");
      return;
    }

    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length < 10) {
      toast.show(
        "Enter a valid phone number with at least 10 digits.",
        "warning"
      );
      return;
    }

    if (dob && Number.isNaN(Date.parse(dob))) {
      toast.show("Enter a valid date of birth.", "error");
      return;
    }

    setSaving(true);

    try {
      const result = await apiClient.put("/profile", {
        phone: phone.trim(),
        dob: dob || null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        bio: bio.trim(),
        avatar: avatarPreview,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyPhone: emergencyPhone.trim(),
      });

      const saved = result.profile ?? {};

      setProfile((previous) => ({
        ...previous,
        ...saved,
      }));

      if (typeof updateUser === "function") {
        updateUser({
          name: fullName.trim(),
          avatar: saved.avatar ?? avatarPreview ?? null,
        });
      }

      setIsDirty(false);
      toast.show("Profile saved successfully.", "success");
    } catch (error) {
      toast.show(
        error.message || "Failed to save your profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscard() {
    if (isDirty) {
      await loadProfile();
    }
  }

  function markDirty(setter, value) {
    setter(value);
    setIsDirty(true);
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  const displayName =
    user?.name || profile.name || fullName || "Student";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Link
              to="/student/dashboard"
              className="transition hover:text-navy"
            >
              Dashboard
            </Link>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="text-orange">Profile</span>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Student Profile
          </h1>
        </div>

        <span className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-navy sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {profile.role || user?.role || "Student"}
        </span>
      </div>

      {/* Profile identity card */}
      <div className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-7 lg:flex-row lg:items-center">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-navy text-2xl font-bold text-white shadow-md ring-4 ring-slate-100">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "S"
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white shadow-md"
            >
              <Camera size={15} />
            </button>

            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                aria-label="Remove profile photo"
                className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 shadow"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">
                {displayName}
              </h2>

              {isDirty && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  Unsaved Changes
                </span>
              )}
            </div>

            <p className="text-sm text-muted">
              {profile.email || user?.email || "No email available"}
            </p>

            <span className="flex items-center gap-1 pt-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              Account information
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty || saving}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-100 disabled:opacity-40"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-orange px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-orange-hover disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold ${
                activeTab === "personal"
                  ? "bg-white text-navy shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <User size={15} />
              Personal Details
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold ${
                activeTab === "contact"
                  ? "bg-white text-navy shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <MapPin size={15} />
              Contact &amp; Address
            </button>
          </div>

          {activeTab === "personal" && (
            <section className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-7">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-navy">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Personal Information
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Your account identity and personal details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    title="Account name is managed by the account service."
                    className="h-10 w-full rounded-xl border border-line bg-slate-100 px-3.5 text-sm text-muted"
                  />
                  <p className="text-[11px] text-muted">
                    Account name is managed separately from profile details.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      value={profile.email || user?.email || ""}
                      className="h-10 w-full rounded-xl border border-line bg-slate-100 px-3.5 pr-9 text-sm text-muted"
                    />
                    <Lock
                      size={14}
                      className="absolute right-3 top-3 text-muted"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-3 text-muted"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        markDirty(setPhone, e.target.value)
                      }
                      placeholder="+91 98765 43210"
                      className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink focus:border-navy focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar
                      size={14}
                      className="absolute left-3 top-3 text-muted"
                    />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) =>
                        markDirty(setDob, e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink focus:border-navy focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) =>
                      markDirty(setGender, e.target.value)
                    }
                    className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary / Other</option>
                    <option value="Prefer not to say">
                      Prefer not to say
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) =>
                      markDirty(setBloodGroup, e.target.value)
                    }
                    className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink">
                  Academic Focus &amp; Biography
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => markDirty(setBio, e.target.value)}
                  placeholder="Tell faculty and peers about your academic interests..."
                  className="w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink focus:border-navy focus:bg-white focus:outline-none"
                />
              </div>
            </section>
          )}

          {activeTab === "contact" && (
            <section className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-7">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-navy">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Contact &amp; Address
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Residential and emergency contact information.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-ink">
                    Residential / Hostel Address
                  </label>
                  <input
                    value={street}
                    onChange={(e) => markDirty(setStreet, e.target.value)}
                    placeholder="Hostel, block, room number..."
                    className="h-10 rounded-xl border border-line bg-canvas px-3.5 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    City / District
                  </label>
                  <input
                    value={city}
                    onChange={(e) => markDirty(setCity, e.target.value)}
                    className="h-10 rounded-xl border border-line bg-canvas px-3.5 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    State / Province
                  </label>
                  <input
                    value={state}
                    onChange={(e) => markDirty(setState, e.target.value)}
                    className="h-10 rounded-xl border border-line bg-canvas px-3.5 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Postal Code / PIN
                  </label>
                  <input
                    value={pincode}
                    onChange={(e) => markDirty(setPincode, e.target.value)}
                    className="h-10 rounded-xl border border-line bg-canvas px-3.5 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink">
                    Emergency Guardian Name
                  </label>
                  <input
                    value={emergencyName}
                    onChange={(e) =>
                      markDirty(setEmergencyName, e.target.value)
                    }
                    className="h-10 rounded-xl border border-line bg-canvas px-3.5 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-ink">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) =>
                      markDirty(setEmergencyPhone, e.target.value)
                    }
                    className="h-10 rounded-xl border border-line bg-canvas px-3.5 text-sm"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Bottom actions */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:p-5">
            <span className="text-xs text-muted">
              {isDirty ? "You have unsaved changes." : "All changes saved."}
            </span>

            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!isDirty || saving}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:bg-slate-100 disabled:opacity-40"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-orange px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-hover disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Profile completeness */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Profile Completeness
              </span>
              <span className="text-xs font-bold text-orange">
                {completionPercentage}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="text-[11px] leading-relaxed text-muted">
              {completionPercentage === 100
                ? "All required profile fields are complete."
                : "Complete your contact and emergency details to finish your profile."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
