const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mockRequest(result, ms = 400) {
  await delay(ms);
  return result;
}

export function api() {
  return {
    get: (path) =>
      mockRequest({
        ok: false,
        path,
        data: null,
        message: "Backend is not connected yet. Using mock data.",
      }),
    post: (path, body) =>
      mockRequest({
        ok: false,
        path,
        body,
        data: null,
        message: "Backend is not connected yet. Using mock data.",
      }),
  };
}

export { delay, mockRequest };
