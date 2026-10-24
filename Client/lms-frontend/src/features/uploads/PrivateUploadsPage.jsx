import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Cloud,
  CloudUpload,
  FileUp,
  Search,
  Folder,
  FolderPlus,
  FolderArchive,
  FolderInput,
  FileText,
  Code,
  Image,
  File,
  Download,
  Trash2,
  LayoutGrid,
  List,
  Lock,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  getPrivateFiles,
  uploadPrivateFile,
  getPrivateFileDownload,
  deletePrivateFile,
  movePrivateFile,
  getPrivateFolders,
  createPrivateFolder,
} from "../../services/privateFileService";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../hooks/useToast";

function getFileType(filename = "", mimeType = "") {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (["pdf"].includes(ext) || mime.includes("pdf")) return "pdf";
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext) || mime.includes("word") || mime.includes("text")) return "doc";
  if (["c", "cpp", "py", "js", "jsx", "ts", "tsx", "html", "css", "json", "java", "sql", "sh"].includes(ext)) return "code";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext) || mime.includes("image")) return "image";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext) || mime.includes("zip") || mime.includes("archive")) return "archive";
  return "file";
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(isoString) {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(isoString);
  }
}

export function PrivateUploadsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Data state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [selectedFolder, setSelectedFolder] = useState("All"); // "All" | "root" | number
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // Folder creation modal state
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Delete modal state
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deletingFile, setDeletingFile] = useState(false);

  // Move file modal state
  const [fileToMove, setFileToMove] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState("root");
  const [movingFile, setMovingFile] = useState(false);

  // Upload dropzone state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null or number
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch files and folders on mount / reload
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [filesRes, foldersRes] = await Promise.all([
          getPrivateFiles(),
          getPrivateFolders(),
        ]);

        if (cancelled) return;

        const fileList = Array.isArray(filesRes?.files)
          ? filesRes.files
          : Array.isArray(filesRes)
          ? filesRes
          : [];

        const folderList = Array.isArray(foldersRes?.folders)
          ? foldersRes.folders
          : Array.isArray(foldersRes)
          ? foldersRes
          : [];

        setFiles(fileList);
        setFolders(folderList);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to retrieve your private files.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // Storage Quota (100 MB Limit)
  const TOTAL_QUOTA_BYTES = 100 * 1024 * 1024;
  const usedBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);
  }, [files]);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const quotaPercent = Math.min(100, Math.round((usedBytes / TOTAL_QUOTA_BYTES) * 100 * 10) / 10);

  // Filtered & Sorted files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesFolder =
          selectedFolder === "All" ||
          (selectedFolder === "root" && (file.folderId === null || file.folderId === undefined)) ||
          file.folderId === Number(selectedFolder);

        const type = getFileType(file.originalName, file.mimeType);
        const matchesType = selectedType === "all" || type === selectedType;

        const query = searchQuery.trim().toLowerCase();
        const folderName =
          folders.find((f) => f.id === file.folderId)?.name || "Root Directory";

        const matchesQuery =
          !query ||
          (file.originalName && file.originalName.toLowerCase().includes(query)) ||
          folderName.toLowerCase().includes(query);

        return matchesFolder && matchesType && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "name-asc") {
          return (a.originalName || "").localeCompare(b.originalName || "");
        }
        if (sortBy === "size-desc") {
          return (b.size || 0) - (a.size || 0);
        }
        return 0;
      });
  }, [files, folders, selectedFolder, selectedType, searchQuery, sortBy]);

  // Document type counters
  const pdfCount = useMemo(
    () => files.filter((f) => getFileType(f.originalName, f.mimeType) === "pdf").length,
    [files]
  );
  const docCount = useMemo(
    () => files.filter((f) => getFileType(f.originalName, f.mimeType) === "doc").length,
    [files]
  );

  // Handle file selection / upload
  async function handleFilesPicked(fileList) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList);

    // Validate size (max 25 MB per backend limit)
    const MAX_SIZE = 25 * 1024 * 1024;
    const oversized = picked.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      toast.show(`"${oversized.name}" exceeds the 25 MB maximum file size limit.`, "error");
      return;
    }

    const target = picked[0];

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const formData = new FormData();
      formData.append("file", target);

      // Include folderId if a specific folder is currently selected
      if (selectedFolder !== "All" && selectedFolder !== "root") {
        formData.append("folderId", String(selectedFolder));
      }

      const res = await uploadPrivateFile(formData, {
        onUploadProgress: (percent) => setUploadProgress(percent),
      });

      setUploadProgress(100);
      toast.show(res?.message || `"${target.name}" uploaded successfully.`, "success");

      setTimeout(() => {
        setUploadProgress(null);
      }, 500);

      setReloadKey((k) => k + 1);
    } catch (err) {
      setUploadProgress(null);
      toast.show(err.message || "Could not upload file.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Handle Drag & Drop
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFilesPicked(e.dataTransfer.files);
  }

  // Download Handler via Signed URL
  async function handleDownload(file) {
    try {
      toast.show(`Requesting download link for "${file.originalName}"...`, "info");
      const res = await getPrivateFileDownload(file.id);

      if (res?.downloadUrl) {
        const a = document.createElement("a");
        a.href = res.downloadUrl;
        a.setAttribute("download", file.originalName);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error("Download URL could not be generated.");
      }
    } catch (err) {
      toast.show(err.message || "Failed to generate download link.", "error");
    }
  }

  // Delete Handler
  async function confirmDeleteFile() {
    if (!fileToDelete) return;

    try {
      setDeletingFile(true);
      await deletePrivateFile(fileToDelete.id);
      toast.show(`Deleted "${fileToDelete.originalName}".`, "success");
      setFileToDelete(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.show(err.message || "Failed to delete file.", "error");
    } finally {
      setDeletingFile(false);
    }
  }

  // Create New Folder Handler
  async function handleCreateFolder(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    if (trimmed.length > 100) {
      toast.show("Folder name must be 100 characters or fewer.", "warning");
      return;
    }

    try {
      setCreatingFolder(true);
      const res = await createPrivateFolder(trimmed);
      toast.show(res?.message || `Created folder "${trimmed}".`, "success");
      setNewFolderName("");
      setNewFolderModalOpen(false);

      if (res?.folder?.id) {
        setSelectedFolder(res.folder.id);
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.show(err.message || "Failed to create folder.", "error");
    } finally {
      setCreatingFolder(false);
    }
  }

  // Open Move Modal
  function handleOpenMove(file) {
    setFileToMove(file);
    setTargetFolderId(file.folderId ? String(file.folderId) : "root");
  }

  // Move File Handler
  async function handleConfirmMoveFile(e) {
    e.preventDefault();
    if (!fileToMove) return;

    try {
      setMovingFile(true);
      const folderId = targetFolderId === "root" || targetFolderId === "" ? null : Number(targetFolderId);
      const res = await movePrivateFile(fileToMove.id, folderId);
      toast.show(res?.message || "File moved successfully.", "success");
      setFileToMove(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.show(err.message || "Failed to move file.", "error");
    } finally {
      setMovingFile(false);
    }
  }

  // Reset Filters
  function handleResetFilters() {
    setSearchQuery("");
    setSelectedFolder("All");
    setSelectedType("all");
    setSortBy("date-desc");
  }

  // Render File Type Icon
  function renderTypeIcon(type) {
    switch (type) {
      case "pdf":
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
        );
      case "doc":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
        );
      case "code":
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Code size={20} />
          </div>
        );
      case "image":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Image size={20} />
          </div>
        );
      case "archive":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FolderArchive size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-navy flex items-center justify-center shrink-0">
            <File size={20} />
          </div>
        );
    }
  }

  const activeFolderName = useMemo(() => {
    if (selectedFolder === "All") return "All Files";
    if (selectedFolder === "root") return "Root Directory";
    const found = folders.find((f) => f.id === Number(selectedFolder));
    return found ? found.name : "Selected Folder";
  }, [selectedFolder, folders]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Storage Quota Hero Card */}
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-7 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Link to="/student/dashboard" className="hover:text-navy transition">
              Dashboard
            </Link>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="text-orange">Private Files</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Private Files
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Store personal notes, drafts, and study materials securely. Files stored in this locker
            are strictly private and visible only to you.
          </p>
        </div>

        {/* Storage Quota Widget */}
        <div className="flex items-center gap-4 bg-canvas border border-line p-4 rounded-2xl self-start md:self-auto shrink-0 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-navy flex items-center justify-center shrink-0">
            <Cloud size={24} />
          </div>
          <div className="flex flex-col min-w-[180px]">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink">Storage Quota</span>
              <span className="text-orange">{loading ? "..." : `${quotaPercent}%`}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-orange rounded-full transition-all duration-500"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-muted mt-1 font-medium">
              {loading ? "Calculating storage..." : `${usedMB} MB of 100 MB used`}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Documents */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
              <FileText size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Total Documents
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold text-ink">
                {loading ? "..." : `${files.length} Files`}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-muted bg-slate-100 px-2.5 py-1 rounded-lg">
            {loading ? "..." : `${pdfCount} PDF, ${docCount} Doc`}
          </span>
        </div>

        {/* Card 2: Active Folders */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
              <Folder size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Active Folders
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold text-ink">
                {loading ? "..." : `${folders.length} Directories`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewFolderModalOpen(true)}
            className="text-xs font-semibold text-orange hover:underline bg-orange/10 px-2.5 py-1 rounded-lg transition"
          >
            + New
          </button>
        </div>

        {/* Card 3: Access Status */}
        <div className="p-5 rounded-2xl bg-white border border-line shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-navy shrink-0">
              <Lock size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Access Status
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold text-ink">
                End-to-End
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Private Locker</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-card flex flex-col gap-6">
        {/* Controls Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              disabled={isUploading}
              onChange={(e) => handleFilesPicked(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-orange hover:bg-orange-hover text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileUp size={16} />
              )}
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </button>

            <button
              type="button"
              onClick={() => setNewFolderModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-ink px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition"
            >
              <FolderPlus size={16} className="text-navy" />
              <span>New Folder</span>
            </button>
          </div>

          {/* Sort & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-canvas border border-line px-3 py-1.5 rounded-xl gap-2 text-xs">
              <ArrowUpDown size={14} className="text-muted" />
              <span className="text-muted font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-ink focus:outline-none cursor-pointer"
              >
                <option value="date-desc">Date Modified (Latest)</option>
                <option value="name-asc">File Name (A - Z)</option>
                <option value="size-desc">Size (Descending)</option>
              </select>
            </div>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-white text-navy shadow-xs font-bold"
                    : "text-muted hover:text-ink"
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-white text-navy shadow-xs font-bold"
                    : "text-muted hover:text-ink"
                }`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`group relative rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-orange bg-orange/5 scale-[0.99]"
              : "border-slate-200 bg-canvas hover:border-orange/50 hover:bg-slate-50"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-line flex items-center justify-center text-orange shadow-xs group-hover:scale-105 transition-transform">
              <CloudUpload size={26} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">
                Drag &amp; drop study assets here, or{" "}
                <span className="text-orange underline font-semibold">browse device</span>
              </p>
              <p className="text-xs text-muted mt-1">
                Target: <span className="font-semibold text-navy">{activeFolderName}</span> • Max upload size: 25 MB per file
              </p>
            </div>
          </div>

          {/* Upload Progress Bar if active */}
          {uploadProgress !== null && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-ink">
                <span>Uploading to institutional vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Folder Navigation Pills & Search Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Folder Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {/* "All" Filter */}
              <button
                type="button"
                onClick={() => setSelectedFolder("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedFolder === "All"
                    ? "bg-navy text-white shadow-xs"
                    : "bg-slate-100 text-muted hover:text-ink"
                }`}
              >
                <span>All Files</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedFolder === "All" ? "bg-white/20 text-white" : "bg-white text-muted"
                  }`}
                >
                  {files.length}
                </span>
              </button>

              {/* "Root / Unfiled" Filter */}
              <button
                type="button"
                onClick={() => setSelectedFolder("root")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedFolder === "root"
                    ? "bg-navy text-white shadow-xs"
                    : "bg-slate-100 text-muted hover:text-ink"
                }`}
              >
                <span>Root</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedFolder === "root" ? "bg-white/20 text-white" : "bg-white text-muted"
                  }`}
                >
                  {files.filter((f) => f.folderId === null || f.folderId === undefined).length}
                </span>
              </button>

              {/* User Folders */}
              {folders.map((folder) => {
                const isSelected = selectedFolder === folder.id;
                const count =
                  folder.fileCount ??
                  files.filter((f) => f.folderId === folder.id).length;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-navy text-white shadow-xs"
                        : "bg-slate-100 text-muted hover:text-ink"
                    }`}
                  >
                    <span>{folder.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-white text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* In-locker Realtime Search */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file name..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-line bg-canvas text-xs text-ink focus:outline-none focus:border-navy focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-xl mx-auto my-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-base font-bold text-ink">Failed to Load Files</h4>
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

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-line bg-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="w-14 h-7 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Files View: Grid or List */}
        {!loading && !error && filteredFiles.length === 0 ? (
          <div className="rounded-2xl border border-line bg-canvas p-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-muted flex items-center justify-center mb-3">
              <File size={24} />
            </div>
            <h3 className="font-display text-base font-bold text-ink">No files in this folder</h3>
            <p className="text-xs text-muted max-w-sm mt-1">
              {searchQuery
                ? `No files match your search query "${searchQuery}".`
                : "Your personal folder is currently empty. Drop files above to upload."}
            </p>
            {(searchQuery || selectedFolder !== "All") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : !loading && !error && viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const fileType = getFileType(file.originalName, file.mimeType);
              const folderName =
                folders.find((f) => f.id === file.folderId)?.name || "Root Directory";

              return (
                <div
                  key={file.id}
                  className="group flex flex-col justify-between p-4 rounded-2xl border border-line bg-white hover:border-slate-300 hover:shadow-card transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {renderTypeIcon(fileType)}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenMove(file)}
                          className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition"
                          title="Move to folder"
                          aria-label="Move file"
                        >
                          <FolderInput size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition"
                          title="Download file"
                          aria-label="Download file"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete file"
                          aria-label="Delete file"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col">
                      <span
                        className="font-bold text-xs text-ink truncate block"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </span>
                      <span className="text-[11px] text-muted mt-0.5">
                        {formatBytes(file.size)} • {formatDate(file.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-muted font-medium bg-canvas px-2 py-0.5 rounded-md truncate max-w-[130px]" title={folderName}>
                      {folderName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="text-xs font-bold text-navy hover:text-orange transition flex items-center gap-0.5"
                    >
                      <span>Get</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && !error ? (
          /* LIST VIEW */
          <div className="overflow-x-auto border border-line rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-line text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Document</th>
                  <th className="py-3 px-4 font-bold">Folder</th>
                  <th className="py-3 px-4 font-bold">Size</th>
                  <th className="py-3 px-4 font-bold">Uploaded</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => {
                  const fileType = getFileType(file.originalName, file.mimeType);
                  const folderName =
                    folders.find((f) => f.id === file.folderId)?.name || "Root Directory";

                  return (
                    <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {renderTypeIcon(fileType)}
                          <span className="font-semibold text-ink truncate max-w-xs" title={file.originalName}>
                            {file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted font-medium">{folderName}</td>
                      <td className="py-3 px-4 text-muted font-semibold">{formatBytes(file.size)}</td>
                      <td className="py-3 px-4 text-muted">{formatDate(file.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenMove(file)}
                            className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition"
                            title="Move to folder"
                            aria-label="Move file"
                          >
                            <FolderInput size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition"
                            title="Download"
                            aria-label="Download file"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete"
                            aria-label="Delete file"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Institutional Vault Security Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-orange" />
            <span>
              Institutional Encryption: All personal documents are stored securely in your private cloud locker.
            </span>
          </div>
          <span className="text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-navy">
            Private Cloud Storage (Cloudflare R2)
          </span>
        </div>
      </div>

      {/* MODAL 1: Create New Folder */}
      <Modal
        open={newFolderModalOpen}
        onClose={() => {
          if (!creatingFolder) {
            setNewFolderModalOpen(false);
            setNewFolderName("");
          }
        }}
        title="Create New Directory"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 text-xs sm:text-sm">
          <p className="text-muted leading-relaxed">
            Specify a folder name to organize your academic drafts, syllabus cheatsheets, and project notes.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="folderNameInput" className="text-xs font-bold text-ink">
              Folder Name
            </label>
            <input
              id="folderNameInput"
              type="text"
              required
              maxLength={100}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Machine Learning Lab Drafts"
              className="w-full h-10 px-3.5 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white shadow-xs transition"
              autoFocus
            />
          </div>
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              disabled={creatingFolder}
              onClick={() => {
                setNewFolderModalOpen(false);
                setNewFolderName("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingFolder}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange hover:bg-orange-hover text-white transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {creatingFolder ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Folder</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Delete File Confirmation */}
      <Modal
        open={Boolean(fileToDelete)}
        onClose={() => !deletingFile && setFileToDelete(null)}
        title="Delete File from Private Locker"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong>Warning:</strong> You are about to permanently delete{" "}
              <strong>&quot;{fileToDelete?.originalName}&quot;</strong> from your private locker. This action
              cannot be undone.
            </div>
          </div>
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              disabled={deletingFile}
              onClick={() => setFileToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deletingFile}
              onClick={confirmDeleteFile}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-error hover:bg-rose-700 text-white transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {deletingFile ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Confirm Deletion</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Move File to Folder */}
      <Modal
        open={Boolean(fileToMove)}
        onClose={() => !movingFile && setFileToMove(null)}
        title="Move File"
      >
        <form onSubmit={handleConfirmMoveFile} className="space-y-4 text-xs sm:text-sm">
          <p className="text-muted leading-relaxed">
            Choose a destination directory for <strong>&quot;{fileToMove?.originalName}&quot;</strong>.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Destination Folder</label>
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-line bg-canvas text-xs sm:text-sm text-ink focus:outline-none focus:border-navy focus:bg-white transition cursor-pointer"
            >
              <option value="root">Root Directory (No folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.fileCount ?? 0} files)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              disabled={movingFile}
              onClick={() => setFileToMove(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={movingFile}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-navy hover:bg-navy-hover text-white transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {movingFile ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Moving...</span>
                </>
              ) : (
                <span>Move File</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
