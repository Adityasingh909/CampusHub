import { api } from "./api";

/**
 * Service for Private Uploads (Files & Folders).
 * Connects to:
 * - GET    /api/private-files
 * - POST   /api/private-files (multipart/form-data)
 * - GET    /api/private-files/:id/download
 * - DELETE /api/private-files/:id
 * - PATCH  /api/private-files/:id/folder
 * - GET    /api/private-folders
 * - POST   /api/private-folders
 */

/**
 * Fetch the authenticated user's private files.
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, count: number, files: Array }>}
 */
export async function getPrivateFiles(options = {}) {
  return api().get("/private-files", options);
}

/**
 * Upload a private file.
 * @param {FormData} formData Must contain field 'file', and optionally 'folderId'.
 * @param {object} [options] Can include onUploadProgress callback.
 * @returns {Promise<{ success: boolean, message: string, file: object }>}
 */
export async function uploadPrivateFile(formData, options = {}) {
  return api().post("/private-files", formData, options);
}

/**
 * Request a temporary signed download URL for a file.
 * @param {number|string} fileId
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, downloadUrl: string }>}
 */
export async function getPrivateFileDownload(fileId, options = {}) {
  return api().get(`/private-files/${fileId}/download`, options);
}

/**
 * Permanently delete a private file.
 * @param {number|string} fileId
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function deletePrivateFile(fileId, options = {}) {
  return api().delete(`/private-files/${fileId}`, options);
}

/**
 * Move a file into a folder or back to root (folderId = null).
 * @param {number|string} fileId
 * @param {number|null} folderId
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, message: string, file: object }>}
 */
export async function movePrivateFile(fileId, folderId = null, options = {}) {
  return api().patch(
    `/private-files/${fileId}/folder`,
    { folderId: folderId === "" ? null : folderId },
    options
  );
}

/**
 * Fetch the authenticated user's private folders.
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, count: number, folders: Array }>}
 */
export async function getPrivateFolders(options = {}) {
  return api().get("/private-folders", options);
}

/**
 * Create a new private folder.
 * @param {string} name
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, message: string, folder: object }>}
 */
export async function createPrivateFolder(name, options = {}) {
  return api().post("/private-folders", { name }, options);
}
