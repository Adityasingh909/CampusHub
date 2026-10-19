import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Bell,
  Camera,
  Trash2,
  CheckCircle2,
  Lock,
  ChevronRight,
  Save,
  GraduationCap,
  Download,
  KeyRound,
  Check,
} from "lucide-react";
import {
  getSavedUserProfile,
  saveUserProfileToStorage,
} from "../../data/mockLmsData";
import { useToast } from "../../hooks/useToast";

export function StudentProfilePage() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Load initial profile from localStorage or mock defaults
  const [profile, setProfile] = useState(() => getSavedUserProfile());
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'contact' | 'notifications' | 'security'
  const [avatarPreview, setAvatarPreview] = useState(() => profile.avatar || null);
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(() => profile.name || "");
  const [phone, setPhone] = useState(() => profile.phone || "");
  const [dob, setDob] = useState(() => profile.dob || "2004-08-14");
  const [gender, setGender] = useState(() => profile.gender || "Male");
  const [bloodGroup, setBloodGroup] = useState(() => profile.bloodGroup || "O+");
  const [bio, setBio] = useState(() => profile.bio || "");

  // Address fields
  const [street, setStreet] = useState(() => profile.address?.street || "");
  const [city, setCity] = useState(() => profile.address?.city || "");
  const [state, setState] = useState(() => profile.address?.state || "");
  const [pincode, setPincode] = useState(() => profile.address?.pincode || "");
  const [emergencyName, setEmergencyName] = useState(
    () => profile.address?.emergencyContactName || ""
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    () => profile.address?.emergencyPhone || ""
  );

  // Notification toggles
  const [notifications, setNotifications] = useState(() => ({
    gradeAlerts: profile.notifications?.gradeAlerts ?? true,
    deadlineReminders: profile.notifications?.deadlineReminders ?? true,
    quizAlerts: profile.notifications?.quizAlerts ?? true,
    announcements: profile.notifications?.announcements ?? true,
    cohortVisibility: profile.notifications?.cohortVisibility ?? false,
  }));

  // Password fields for security tab
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Track profile completion percentage
  const completionPercentage = useMemo(() => {
    const required = [fullName, phone, dob, street, city, state, emergencyName, emergencyPhone];
    const filled = required.filter((v) => v && v.trim().length > 0).length;
    return Math.round((filled / required.length) * 100);
  }, [fullName, phone, dob, street, city, state, emergencyName, emergencyPhone]);

  // Handle avatar upload
  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 2 MB)
    if (!file.type.startsWith("image/")) {
      toast.show("Please upload a valid image file (PNG, JPG, or WEBP).", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.show("Image size must be smaller than 2 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setIsDirty(true);
      toast.show("Profile photo updated. Click 'Save Changes' to apply.", "info");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    setIsDirty(true);
    toast.show("Photo removed. Initials fallback will be displayed.", "info");
  }

  // Handle Save
  function handleSaveProfile(e) {
    if (e) e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      toast.show("Full Name is required.", "error");
      return;
    }

    // Phone validation: allow + and digits, minimum 10 digits
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      toast.show("Please enter a valid phone number (at least 10 digits).", "warning");
      return;
    }

    const initials = fullName
      .trim()
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const updatedProfile = {
      ...profile,
      name: fullName.trim(),
      phone: phone.trim(),
      dob,
      gender,
      bloodGroup,
      bio: bio.trim(),
      avatar: avatarPreview,
      initials: initials || "AS",
      address: {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyPhone: emergencyPhone.trim(),
      },
      notifications,
      lastUpdated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    saveUserProfileToStorage(updatedProfile);
    setProfile(updatedProfile);
    setIsDirty(false);
    toast.show("Profile and preferences saved successfully!", "success");
  }

  // Handle Discard
  function handleDiscard() {
    const saved = getSavedUserProfile();
    setProfile(saved);
    setFullName(saved.name || "");
    setPhone(saved.phone || "");
    setDob(saved.dob || "2004-08-14");
    setGender(saved.gender || "Male");
    setBloodGroup(saved.bloodGroup || "O+");
    setBio(saved.bio || "");
    setAvatarPreview(saved.avatar || null);
    setStreet(saved.address?.street || "");
    setCity(saved.address?.city || "");
    setState(saved.address?.state || "");
    setPincode(saved.address?.pincode || "");
    setEmergencyName(saved.address?.emergencyContactName || "");
    setEmergencyPhone(saved.address?.emergencyPhone || "");
    setNotifications({
      gradeAlerts: saved.notifications?.gradeAlerts ?? true,
      deadlineReminders: saved.notifications?.deadlineReminders ?? true,
      quizAlerts: saved.notifications?.quizAlerts ?? true,
      announcements: saved.notifications?.announcements ?? true,
      cohortVisibility: saved.notifications?.cohortVisibility ?? false,
    });
    setIsDirty(false);
    toast.show("Changes discarded. Restored saved profile.", "info");
  }

  // Handle password update
  function handlePasswordChange(e) {
    e.preventDefault();
    if (!currentPassword) {
      toast.show("Please enter your current institutional password.", "warning");
      return;
    }
    if (newPassword.length < 8) {
      toast.show("New password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show("New passwords do not match.", "error");
      return;
    }
    toast.show("Password updated successfully across campus credentials.", "success");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  // Download digital student card
  function handleDownloadIdCard() {
    const content = `CAMPUSHUB LMS — DIGITAL STUDENT IDENTITY\n\nStudent Name: ${fullName}\nRoll Number: ${profile.rollNo}\nDepartment: ${profile.department}\nProgram: ${profile.program || "B.Tech Computer Science"}\nEnrollment Semester: ${profile.semester}\nValid Through: ${profile.academics?.validThrough || "June 2028"}\nInstitutional Email: ${profile.email}\nStatus: VERIFIED ENROLLED STUDENT\n\n[Institutional Digital Signature]\nHash: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campushub_id_${profile.rollNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show("Digital Student ID downloaded.", "success");
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Link to="/student/dashboard" className="hover:text-navy transition">
              Dashboard
            </Link>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="text-orange">Profile</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Student Profile
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-navy self-start sm:self-auto border border-line">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Student • Verified Fall 2026</span>
        </div>
      </div>

      {/* Profile Hero / Quick Identity Card */}
      <div className="bg-white rounded-2xl border border-line p-6 sm:p-7 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar with Camera Overlay & Initials fallback */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-navy shadow-md flex items-center justify-center ring-4 ring-slate-100 text-white font-bold text-2xl">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.initials || "AS"}</span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change photo"
              title="Upload new photo"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-navy text-white hover:bg-navy-hover shadow-md flex items-center justify-center transition-transform active:scale-95"
            >
              <Camera size={15} />
            </button>

            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                aria-label="Remove photo"
                title="Remove photo"
                className="absolute top-0 right-0 w-6 h-6 rounded-full bg-rose-50 text-error hover:bg-rose-100 shadow-xs flex items-center justify-center transition"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Student Meta Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">
                {fullName || "Aditya Sharma"}
              </h2>
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted">
              {profile.program || "B.Tech Computer Science & Engineering"} • {profile.school || "School of Computing"}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-ink text-xs font-semibold">
                Roll #{profile.rollNo}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-ink text-xs font-semibold">
                {profile.semester}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Verified Institutional Profile</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top Save / Discard Actions */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-slate-100 transition disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            className="px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Save size={15} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 8 Cols Form + 4 Cols Academic Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Sections with Tabs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Segmented Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none border border-line">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "personal"
                  ? "bg-white text-navy shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <User size={15} />
              <span>Personal Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "contact"
                  ? "bg-white text-navy shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <MapPin size={15} />
              <span>Contact &amp; Address</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "notifications"
                  ? "bg-white text-navy shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Bell size={15} />
              <span>Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "security"
                  ? "bg-white text-navy shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <ShieldCheck size={15} />
              <span>Security</span>
            </button>
          </div>

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === "personal" && (
            <div className="bg-white rounded-2xl border border-line p-6 sm:p-7 shadow-card flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Personal Information
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Update student identity parameters registered with the university registrar.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
                  <User size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullNameInput" className="text-xs font-bold text-ink">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="fullNameInput"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                {/* Institutional Email (Read-only) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink">
                      Student Institutional Email
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      readOnly
                      value={profile.email}
                      className="w-full h-10 px-3.5 pr-9 rounded-xl border border-line bg-slate-100 text-muted text-xs sm:text-sm cursor-not-allowed"
                    />
                    <Lock size={14} className="absolute right-3 text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phoneInput" className="text-xs font-bold text-ink">
                    Phone Number <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Phone size={14} className="absolute left-3 text-muted pointer-events-none" />
                    <input
                      id="phoneInput"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dobInput" className="text-xs font-bold text-ink">
                    Date of Birth
                  </label>
                  <div className="relative flex items-center">
                    <Calendar size={14} className="absolute left-3 text-muted pointer-events-none" />
                    <input
                      id="dobInput"
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                    />
                  </div>
                </div>

                {/* Gender Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="genderSelect" className="text-xs font-bold text-ink">
                    Gender
                  </label>
                  <select
                    id="genderSelect"
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary / Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Blood Group Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bloodGroupSelect" className="text-xs font-bold text-ink">
                    Blood Group
                  </label>
                  <select
                    id="bloodGroupSelect"
                    value={bloodGroup}
                    onChange={(e) => {
                      setBloodGroup(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition cursor-pointer"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Bio / About Me */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="bioInput" className="text-xs font-bold text-ink">
                  Academic Focus &amp; Biography
                </label>
                <textarea
                  id="bioInput"
                  rows={3}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Tell faculty and peers about your academic interests, focus areas, and technical proficiencies..."
                  className="w-full p-3 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & ADDRESS */}
          {activeTab === "contact" && (
            <div className="bg-white rounded-2xl border border-line p-6 sm:p-7 shadow-card flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Contact &amp; Hostel Address
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Campus residential details and emergency guardian contacts.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
                  <MapPin size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="streetInput" className="text-xs font-bold text-ink">
                    Residential / Hostel Address
                  </label>
                  <input
                    id="streetInput"
                    type="text"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Room 304, Kaveri Hostel Block B"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cityInput" className="text-xs font-bold text-ink">
                    City / District
                  </label>
                  <input
                    id="cityInput"
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Bengaluru"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="stateInput" className="text-xs font-bold text-ink">
                    State / Province
                  </label>
                  <input
                    id="stateInput"
                    type="text"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Karnataka"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pincodeInput" className="text-xs font-bold text-ink">
                    Postal Code / PIN
                  </label>
                  <input
                    id="pincodeInput"
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 560100"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="emergencyNameInput" className="text-xs font-bold text-ink">
                    Emergency Guardian Name
                  </label>
                  <input
                    id="emergencyNameInput"
                    type="text"
                    value={emergencyName}
                    onChange={(e) => {
                      setEmergencyName(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Dr. Rajesh Sharma (Father)"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="emergencyPhoneInput" className="text-xs font-bold text-ink">
                    Emergency Contact Phone
                  </label>
                  <input
                    id="emergencyPhoneInput"
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => {
                      setEmergencyPhone(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="+91 98765 00000"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATION PREFERENCES */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-line p-6 sm:p-7 shadow-card flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Notification Preferences
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Customize alerts received on your institutional portal and registered email.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
                  <Bell size={18} />
                </div>
              </div>

              <div className="space-y-4">
                {/* Toggle 1: Grade Alerts */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line/70">
                  <div className="pr-4">
                    <span className="font-bold text-xs sm:text-sm text-ink block">
                      Grade &amp; Evaluation Releases
                    </span>
                    <span className="text-xs text-muted">
                      Receive instant alerts when assignments or mid-term test scores are published.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications((prev) => ({ ...prev, gradeAlerts: !prev.gradeAlerts }));
                      setIsDirty(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      notifications.gradeAlerts ? "bg-orange" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ${
                        notifications.gradeAlerts ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Deadline Reminders */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line/70">
                  <div className="pr-4">
                    <span className="font-bold text-xs sm:text-sm text-ink block">
                      24-Hour Assignment Deadlines
                    </span>
                    <span className="text-xs text-muted">
                      Get automated reminders 24 hours prior to assignment submission deadlines.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications((prev) => ({ ...prev, deadlineReminders: !prev.deadlineReminders }));
                      setIsDirty(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      notifications.deadlineReminders ? "bg-orange" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ${
                        notifications.deadlineReminders ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Quiz Alerts */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line/70">
                  <div className="pr-4">
                    <span className="font-bold text-xs sm:text-sm text-ink block">
                      Live Quiz &amp; Midterm Announcements
                    </span>
                    <span className="text-xs text-muted">
                      Notify me when instructor opens live assessment windows.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications((prev) => ({ ...prev, quizAlerts: !prev.quizAlerts }));
                      setIsDirty(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      notifications.quizAlerts ? "bg-orange" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ${
                        notifications.quizAlerts ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 4: General Announcements */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line/70">
                  <div className="pr-4">
                    <span className="font-bold text-xs sm:text-sm text-ink block">
                      Dean &amp; Faculty Broadcasts
                    </span>
                    <span className="text-xs text-muted">
                      Official campus updates, timetable schedules, and holiday notifications.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications((prev) => ({ ...prev, announcements: !prev.announcements }));
                      setIsDirty(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      notifications.announcements ? "bg-orange" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ${
                        notifications.announcements ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 5: Cohort Directory Visibility */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line/70">
                  <div className="pr-4">
                    <span className="font-bold text-xs sm:text-sm text-ink block">
                      Student Cohort Directory Visibility
                    </span>
                    <span className="text-xs text-muted">
                      Allow peers in your enrolled course groups to discover your profile and email.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications((prev) => ({ ...prev, cohortVisibility: !prev.cohortVisibility }));
                      setIsDirty(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      notifications.cohortVisibility ? "bg-orange" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ${
                        notifications.cohortVisibility ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-line p-6 sm:p-7 shadow-card flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Account Security &amp; Credentials
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Update your campus login passphrase and review identity credentials.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
                  <KeyRound size={18} />
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="currentPasswordInput" className="text-xs font-bold text-ink">
                    Current Password
                  </label>
                  <input
                    id="currentPasswordInput"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPasswordInput" className="text-xs font-bold text-ink">
                    New Password
                  </label>
                  <input
                    id="newPasswordInput"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPasswordInput" className="text-xs font-bold text-ink">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPasswordInput"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
                >
                  <KeyRound size={14} />
                  <span>Update Password</span>
                </button>
              </form>

              <div className="p-4 rounded-xl bg-canvas border border-line flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-ink block">
                    Two-Factor Authentication (2FA)
                  </span>
                  <span className="text-xs text-muted">
                    Secured through CampusHub Single Sign-On (SSO) Authenticator.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">
                  Enforced
                </span>
              </div>
            </div>
          )}

          {/* Action Footer Strip */}
          <div className="bg-white rounded-2xl border border-line p-4 sm:p-5 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted">
              Last profile update: <strong>{profile.lastUpdated || "Oct 16, 2026"}</strong>
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!isDirty}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-slate-100 transition disabled:opacity-40"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Sidebar & Digital Student Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Profile Completion Card */}
          <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-muted">
                Profile Completeness
              </span>
              <span className="text-xs font-bold text-orange">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              {completionPercentage === 100
                ? "Your academic profile is 100% complete and fully verified."
                : "Complete all contact and emergency details for full university roster verification."}
            </p>
          </div>

          {/* Academic Snapshot Card */}
          <div className="bg-white rounded-2xl border border-line p-5 sm:p-6 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-navy" />
                <h3 className="font-display text-sm font-bold text-ink">
                  Academic Snapshot
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-muted">
                Fall 2026
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-line/60">
                <span className="text-[11px] text-muted block">Cumulative GPA</span>
                <span className="font-display text-xl font-bold text-ink block mt-0.5">
                  {profile.academics?.cgpa || "8.92"}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">
                  Scale: 10.0 (Grade A)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-line/60">
                <span className="text-[11px] text-muted block">Credits Earned</span>
                <span className="font-display text-xl font-bold text-ink block mt-0.5">
                  {profile.academics?.totalCredits || 84} / {profile.academics?.requiredCredits || 160}
                </span>
                <span className="text-[10px] font-semibold text-muted">
                  52.5% Degree Progress
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-line/60">
                <span className="text-[11px] text-muted block">Attendance</span>
                <span className="font-display text-xl font-bold text-emerald-700 block mt-0.5">
                  {profile.academics?.attendanceRate || "94.2%"}
                </span>
                <span className="text-[10px] font-semibold text-muted">
                  Optimal &gt; 85%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-line/60">
                <span className="text-[11px] text-muted block">Cohort Standing</span>
                <span className="font-display text-xl font-bold text-ink block mt-0.5">
                  Top 5%
                </span>
                <span className="text-[10px] font-semibold text-orange">
                  Dean&apos;s Merit List
                </span>
              </div>
            </div>
          </div>

          {/* Digital Student Identity Card */}
          <div className="rounded-2xl border-2 border-navy/20 bg-gradient-to-br from-navy to-slate-900 text-white p-6 shadow-card flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-orange flex items-center justify-center font-bold text-xs text-white">
                    C
                  </div>
                  <span className="font-display text-xs font-bold uppercase tracking-wider">
                    CampusHub
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Active Card
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-lg font-bold shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile.initials || "AS"}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-white">
                    {fullName || "Aditya Sharma"}
                  </h4>
                  <span className="text-xs text-slate-300 block font-mono mt-0.5">
                    {profile.rollNo}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Dept. of Computer Science &amp; Eng
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Valid Thru: {profile.academics?.validThrough || "June 2028"}</span>
                <span className="font-mono text-[10px] tracking-widest text-slate-400">
                  ||| | |||| | |||
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadIdCard}
                className="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/15"
              >
                <Download size={14} />
                <span>Download Digital ID</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
