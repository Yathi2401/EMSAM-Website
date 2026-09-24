const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("emsamToken");
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    if (response.status === 401 && token && path !== "/auth/login") clearSession();
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export function serverFileUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.startsWith("/media/")) return fileUrl;
  return `${SERVER_URL}${encodeURI(fileUrl)}`;
}

export function saveSession(token, user) {
  localStorage.setItem("emsamToken", token);
  localStorage.setItem("emsamUser", JSON.stringify(user));
}

export function getCurrentUser() {
  const value = localStorage.getItem("emsamUser");
  try {
    const user = value ? JSON.parse(value) : null;
    if (!user || typeof user !== "object" || !user.id || !["student", "admin"].includes(user.role) || !localStorage.getItem("emsamToken")) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("emsamToken");
  localStorage.removeItem("emsamUser");
}
