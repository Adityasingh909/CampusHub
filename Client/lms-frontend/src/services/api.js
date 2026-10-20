// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// async function mockRequest(result, ms = 400) {
//   await delay(ms);
//   return result;
// }

// export function api() {
//   return {
//     get: (path) =>
//       mockRequest({
//         ok: false,
//         path,
//         data: null,
//         message: "Backend is not connected yet. Using mock data.",
//       }),
//     post: (path, body) =>
//       mockRequest({
//         ok: false,
//         path,
//         body,
//         data: null,
//         message: "Backend is not connected yet. Using mock data.",
//       }),
//   };
// }

// export { delay, mockRequest };
 


// const API_BASE_URL = "http://localhost:2000/api";

// async function request(path, options = {}) {
//   let response;

//   try {
//     response = await fetch(`${API_BASE_URL}${path}`, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     });
//   } catch {
//     throw new Error(
//       "Cannot connect to the backend. Make sure your server is running on port 2000."
//     );
//   }

//   const data = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     throw new Error(
//       data.message || `Request failed with status ${response.status}.`
//     );
//   }

//   return data;
// }

// export function api() {
//   return {
//     get: (path) => request(path),

//     post: (path, body) =>
//       request(path, {
//         method: "POST",
//         body: JSON.stringify(body),
//       }),
//   };
// }


const API_URL = "http://localhost:2000/api";

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

  const request = async (method, endpoint, data) => {
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Request failed");
    }

    return result;
  };

  return {
    get: (endpoint) => request("GET", endpoint),
    post: (endpoint, data) => request("POST", endpoint, data),
    put: (endpoint, data) => request("PUT", endpoint, data),
    delete: (endpoint) => request("DELETE", endpoint),
  };
};