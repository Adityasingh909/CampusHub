const API_URL = "http://localhost:2000/api";

// Active in-flight request tracking for global loading indicator
let activeRequestCount = 0;
const requestListeners = new Set();

function notifyListeners() {
  requestListeners.forEach((fn) => {
    try {
      fn(activeRequestCount);
    } catch {
      // ignore subscriber error
    }
  });
}

/**
 * Subscribe to changes in active HTTP request count.
 * @param {(count: number) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToRequestCount(callback) {
  requestListeners.add(callback);
  callback(activeRequestCount);
  return () => {
    requestListeners.delete(callback);
  };
}

/**
 * Get current count of active requests.
 * @returns {number}
 */
export function getActiveRequestCount() {
  return activeRequestCount;
}

export const api = () => {
  const getToken = () => {
    try {
      const auth = JSON.parse(
        localStorage.getItem("campushub_auth") || "{}"
      );
      return auth.token;
    } catch {
      return null;
    }
  };

  const request = async (method, endpoint, data, options = {}) => {
    const isSilent = Boolean(options?.silent);

    if (!isSilent) {
      activeRequestCount++;
      notifyListeners();
    }

    try {
      const token = getToken();
      const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

      // When onUploadProgress is specified, use XMLHttpRequest to track upload progress
      if (typeof options?.onUploadProgress === "function") {
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, `${API_URL}${endpoint}`, true);
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
          if (!isFormData) {
            xhr.setRequestHeader("Content-Type", "application/json");
          }
          if (options?.headers) {
            Object.entries(options.headers).forEach(([k, v]) => {
              xhr.setRequestHeader(k, v);
            });
          }
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const percent = Math.round((evt.loaded / evt.total) * 100);
              options.onUploadProgress(percent, evt);
            }
          };
          xhr.onload = () => {
            let result = {};
            try {
              result = JSON.parse(xhr.responseText);
            } catch {
              result = {};
            }
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(result);
            } else {
              reject(new Error(result.message || `Request failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error occurred."));
          xhr.onabort = () => reject(new Error("Request was aborted."));
          xhr.send(
            isFormData
              ? data
              : data !== undefined
              ? JSON.stringify(data)
              : null
          );
        });
      }

      const headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options?.headers || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const fetchOptions = {
        method,
        headers,
        ...(data !== undefined
          ? { body: isFormData ? data : JSON.stringify(data) }
          : {}),
        ...(options?.signal ? { signal: options.signal } : {}),
      };

      const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        const err = new Error(result.message || `Request failed with status ${response.status}`);
        err.status = response.status;
        err.data = result;
        err.attemptId = result?.attemptId;
        throw err;
      }

      return result;
    } finally {
      if (!isSilent) {
        activeRequestCount = Math.max(0, activeRequestCount - 1);
        notifyListeners();
      }
    }
  };

  return {
    get: (endpoint, options) => request("GET", endpoint, undefined, options),
    post: (endpoint, data, options) => request("POST", endpoint, data, options),
    put: (endpoint, data, options) => request("PUT", endpoint, data, options),
    patch: (endpoint, data, options) => request("PATCH", endpoint, data, options),
    delete: (endpoint, options) => request("DELETE", endpoint, undefined, options),
  };
};
