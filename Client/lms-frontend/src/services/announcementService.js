import { api } from "./api";

/**
 * Service for Course Announcements.
 * Planned backend endpoints:
 * - GET    /courses/:courseId/announcements
 * - POST   /courses/:courseId/announcements
 * - PUT    /announcements/:id
 * - DELETE /announcements/:id
 */

/**
 * Fetch all announcements for a given course.
 * @param {string|number} courseId
 * @param {object} [options]
 * @returns {Promise<any>}
 */
export async function getCourseAnnouncements(courseId, options = {}) {
  return api().get(`/courses/${courseId}/announcements`, options);
}

/**
 * Create a new announcement for a course.
 * @param {string|number} courseId
 * @param {{ title: string, message: string, priority?: string }} data
 * @param {object} [options]
 * @returns {Promise<any>}
 */
export async function createAnnouncement(courseId, data, options = {}) {
  return api().post(`/courses/${courseId}/announcements`, data, options);
}

/**
 * Update an existing announcement.
 * @param {string|number} announcementId
 * @param {{ title?: string, message?: string, priority?: string }} data
 * @param {object} [options]
 * @returns {Promise<any>}
 */
export async function updateAnnouncement(announcementId, data, options = {}) {
  return api().put(`/announcements/${announcementId}`, data, options);
}

/**
 * Delete an announcement.
 * @param {string|number} announcementId
 * @param {object} [options]
 * @returns {Promise<any>}
 */
export async function deleteAnnouncement(announcementId, options = {}) {
  return api().delete(`/announcements/${announcementId}`, options);
}
