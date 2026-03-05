export const formatDate = (date) => {
  // Get the month, day, and year
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
};

export function dateFormatter(dateString) {
  const inputDate = new Date(dateString);

  if (isNaN(inputDate)) {
    return "Invalid Date";
  }

  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const day = String(inputDate.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}


export function getInitials(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return ""; // or return "NA"
  }

  const names = fullName.trim().split(" ").filter(Boolean);

  const initials = names.slice(0, 2).map((name) => {
    if (!name) return "";
    return name[0].toUpperCase();
  });

  return initials.join("");
}

export const PRIOTITYSTYELS = {
  HIGH: "text-red-600",
  MEDIUM: "text-yellow-600",
  LOW: "text-blue-600",
};

export const TASK_TYPE = {
  TODO: "bg-blue-600",
  INPROGRESS: "bg-yellow-600",
  COMPLETED: "bg-green-600",
};

export const BGS = [
  "bg-blue-600",
  "bg-yellow-600",
  "bg-red-600",
  "bg-green-600",
];

// Compute the default landing path for a logged-in user
// Prefers module paths from backend (e.g. "/admin/dashboard") and
// falls back to role-prefixed dashboard routes.
export const getDefaultLandingPath = (user) => {
  if (!user) return "/log-in";

  const modules = Array.isArray(user.modules) ? user.modules : [];

  // Prefer a module whose name looks like "Dashboard"
  const dashboardModule = modules.find((m) =>
    (m?.name || "").toString().toLowerCase().includes("dashboard")
  );
  if (dashboardModule?.path) return dashboardModule.path;

  // Otherwise pick the first module that has a path
  const firstWithPath = modules.find((m) => m && m.path);
  if (firstWithPath?.path) return firstWithPath.path;

  // Fallback by normalized role -> /<role-prefix>/dashboard
  const role = (user.role || "").toString().toLowerCase().replace(/\s|-/g, "");
  if (role === "admin") return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  if (role === "employee") return "/employee/dashboard";
  if (role === "client") return "/client/dashboard";
  if (role === "clientviewer") return "/client-viewer/dashboard";

  // As a last resort, send to login
  return "/log-in";
};

