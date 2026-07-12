const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
    data = { message: "The server returned an invalid response." };
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
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
  return value ? JSON.parse(value) : null;
}

export function clearSession() {
  localStorage.removeItem("emsamToken");
  localStorage.removeItem("emsamUser");
}
