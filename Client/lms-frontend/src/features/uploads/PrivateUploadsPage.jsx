import { useState, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Cloud,
  CloudUpload,
  FileUp,
  Search,
  Folder,
  FolderPlus,
  FolderArchive,
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
} from "lucide-react";
import {
  getSavedPrivateFiles,
  savePrivateFilesToStorage,
  getSavedFolders,
  saveFoldersToStorage,
} from "../../data/mockLmsData";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";

function getFileType(filename = "") {
  const ext = filename.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["c", "cpp", "py", "js", "jsx", "ts", "tsx", "html", "css", "json", "java"].includes(ext)) return "code";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "image";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "archive";
  return "file";
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function PrivateUploadsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Load files & folders from localStorage
  const [files, setFiles] = useState(() => getSavedPrivateFiles());
  const [folders, setFolders] = useState(() => getSavedFolders());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // Modals state
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [fileToDelete, setFileToDelete] = useState(null);

  // Upload dropzone state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null or number
  const fileInputRef = useRef(null);

  // Storage Quota (100 MB Limit)
  const TOTAL_QUOTA_BYTES = 100 * 1024 * 1024;
  const usedBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.sizeBytes || 1024 * 1024), 0);
  }, [files]);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const quotaPercent = Math.min(100, Math.round((usedBytes / TOTAL_QUOTA_BYTES) * 100 * 10) / 10);

  // Filtered & Sorted files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesFolder = selectedFolder === "All" || file.folder === selectedFolder;
        const matchesType = selectedType === "all" || file.type === selectedType;
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          file.name.toLowerCase().includes(query) ||
          file.folder.toLowerCase().includes(query);
        return matchesFolder && matchesType && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return (b.id || "").localeCompare(a.id || "");
        }
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "size-desc") {
          return (b.sizeBytes || 0) - (a.sizeBytes || 0);
        }
        return 0;
      });
  }, [files, selectedFolder, selectedType, searchQuery, sortBy]);

  // Statistics
  const pdfCount = useMemo(() => files.filter((f) => f.type === "pdf").length, [files]);
  const docCount = useMemo(() => files.filter((f) => f.type === "doc").length, [files]);

  // Handle file selection / upload
  function handleFilesPicked(fileList) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList);

    // Validate size (max 25 MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    const oversized = picked.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      toast.show(`"${oversized.name}" exceeds the 25 MB maximum file size limit.`, "error");
      return;
    }

    // Check duplicate name
    const existing = files.find((f) => f.name.toLowerCase() === picked[0].name.toLowerCase());
    if (existing) {
      toast.show(`A file named "${picked[0].name}" already exists in your locker.`, "warning");
    }

    // Simulate upload progress
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    // Read file for local in-browser download capability
    const target = picked[0];
    const reader = new FileReader();

    reader.onload = () => {
      clearInterval(interval);
      setUploadProgress(100);

      const targetFolder = selectedFolder === "All" ? "Project Drafts" : selectedFolder;
      const newFileRecord = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: target.name,
        folder: targetFolder,
        type: getFileType(target.name),
        size: formatBytes(target.size),
        sizeBytes: target.size,
        updatedAt: "Just now",
        dataUrl: reader.result, // Preserves file content for downloads
      };

      setTimeout(() => {
        setFiles((prev) => {
          const next = [newFileRecord, ...prev];
          savePrivateFilesToStorage(next);
          return next;
        });
        setUploadProgress(null);
        toast.show(`"${target.name}" uploaded to ${targetFolder}.`, "success");
      }, 300);
    };

    reader.onerror = () => {
      clearInterval(interval);
      setUploadProgress(null);
      toast.show("Could not read file from your device.", "error");
    };

    // Read small files as DataURL, otherwise simulate metadata
    if (target.size < 5 * 1024 * 1024) {
      reader.readAsDataURL(target);
    } else {
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        const targetFolder = selectedFolder === "All" ? "Project Drafts" : selectedFolder;
        const newFileRecord = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: target.name,
          folder: targetFolder,
          type: getFileType(target.name),
          size: formatBytes(target.size),
          sizeBytes: target.size,
          updatedAt: "Just now",
        };
        setFiles((prev) => {
          const next = [newFileRecord, ...prev];
          savePrivateFilesToStorage(next);
          return next;
        });
        setUploadProgress(null);
        toast.show(`"${target.name}" stored in ${targetFolder}.`, "success");
      }, 600);
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

  // Download Handler (Works with real browser download)
  function handleDownload(file) {
    toast.show(`Preparing download for ${file.name}...`, "info");
    if (file.dataUrl) {
      const a = document.createElement("a");
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock baseline file download via synthetic blob
      const content = `CampusHub LMS — Private Academic Locker\n\nFilename: ${file.name}\nFolder: ${file.folder}\nType: ${file.type.toUpperCase()}\nSize: ${file.size}\nDate: ${file.updatedAt}\n\nThis is a verified academic file stored inside your private student vault.\nInstitutional Encryption Status: Active (Simulated Local Storage)`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.endsWith(".txt") ? file.name : `${file.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  // Delete Handler
  function confirmDeleteFile() {
    if (!fileToDelete) return;
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileToDelete.id);
      savePrivateFilesToStorage(next);
      return next;
    });
    toast.show(`Deleted "${fileToDelete.name}".`, "success");
    setFileToDelete(null);
  }

  // Create New Folder
  function handleCreateFolder(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (folders.includes(trimmed)) {
      toast.show(`Folder "${trimmed}" already exists.`, "warning");
      return;
    }
    const nextFolders = [...folders, trimmed];
    setFolders(nextFolders);
    saveFoldersToStorage(nextFolders);
    setSelectedFolder(trimmed);
    setNewFolderName("");
    setNewFolderModalOpen(false);
    toast.show(`Created folder "${trimmed}".`, "success");
  }

  // Reset Filters
  function handleResetFilters() {
    setSearchQuery("");
    setSelectedFolder("All");
    setSelectedType("all");
    setSortBy("date-desc");
  }

  // Get File Type Icon
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
              <span className="text-orange">{quotaPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-orange rounded-full transition-all duration-500"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-muted mt-1 font-medium">
              {usedMB} MB of 100 MB used
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
                {files.length} Files
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-muted bg-slate-100 px-2.5 py-1 rounded-lg">
            {pdfCount} PDF, {docCount} Doc
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
                {folders.filter((f) => f !== "All").length} Directories
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
              onChange={(e) => handleFilesPicked(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-orange hover:bg-orange-hover text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition"
            >
              <FileUp size={16} />
              <span>Upload File</span>
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
          onClick={() => fileInputRef.current?.click()}
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
                Supports PDF, DOCX, ZIP, Code, Images • Maximum upload size: 25 MB per file
              </p>
            </div>
          </div>

          {/* Upload Progress Bar if active */}
          {uploadProgress !== null && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-ink">
                <span>Storing in institutional vault...</span>
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
              {folders.map((folder) => {
                const isSelected = selectedFolder === folder;
                const count =
                  folder === "All"
                    ? files.length
                    : files.filter((f) => f.folder === folder).length;

                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-navy text-white shadow-xs"
                        : "bg-slate-100 text-muted hover:text-ink"
                    }`}
                  >
                    <span>{folder}</span>
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

        {/* Files View: Grid or List */}
        {filteredFiles.length === 0 ? (
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
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group flex flex-col justify-between p-4 rounded-2xl border border-line bg-white hover:border-slate-300 hover:shadow-card transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    {renderTypeIcon(file.type)}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition"
                        title="Download file"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFileToDelete(file)}
                        className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-rose-50 transition"
                        title="Delete file"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col">
                    <span
                      className="font-bold text-xs text-ink truncate block"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">
                      {file.size} • {file.updatedAt}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-muted font-medium bg-canvas px-2 py-0.5 rounded-md truncate max-w-[130px]">
                    {file.folder}
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
            ))}
          </div>
        ) : (
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
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {renderTypeIcon(file.type)}
                        <span className="font-semibold text-ink truncate max-w-xs" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted font-medium">{file.folder}</td>
                    <td className="py-3 px-4 text-muted font-semibold">{file.size}</td>
                    <td className="py-3 px-4 text-muted">{file.updatedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition"
                          title="Download"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-rose-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Institutional Vault Security Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-orange" />
            <span>
              Institutional Encryption: All personal documents are stored securely in your private browser vault.
            </span>
          </div>
          <span className="text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-navy">
            Zero Server Telemetry (Phase 6 Simulated)
          </span>
        </div>
      </div>

      {/* MODAL 1: Create New Folder */}
      <Modal
        open={newFolderModalOpen}
        onClose={() => {
          setNewFolderModalOpen(false);
          setNewFolderName("");
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange hover:bg-orange-hover text-white transition shadow-xs"
            >
              Create Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Delete File Confirmation */}
      <Modal
        open={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        title="Delete File from Private Locker"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong>Warning:</strong> You are about to permanently delete{" "}
              <strong>&quot;{fileToDelete?.name}&quot;</strong> from your private locker. This action
              cannot be undone.
            </div>
          </div>
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFileToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteFile}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-error hover:bg-rose-700 text-white transition shadow-xs"
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
