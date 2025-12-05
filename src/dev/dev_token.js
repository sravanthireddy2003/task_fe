// Dev seed token + user — only used when present (development convenience)
export const DEV_SEED = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFjNTEwYjJkZDBlMzExZjA4OGMyMDAxNTVkYWVkZjUwIiwiaWF0IjoxNzY0ODQxMzIxLCJleHAiOjE3NjQ4NzAxMjF9.N39Dd_oDeM20NiYHHWeyep-WqCuXxuFZeWRHN92WL58",
  refreshToken: null,
  user: {
    id: "ac510b2dd0e311f088c200155daedf50",
    email: "korapatiashwini@gmail.com",
    name: "Admin User",
    role: "Admin",
    modules: [
      { moduleId: "c22786746f3072d6", name: "User Management", access: "full" },
      { moduleId: "6a2ef6584bce3025", name: "Dashboard", access: "full" },
      { moduleId: "45bb31719857f4b3", name: "Clients", access: "full" },
      { moduleId: "39d338c671d58e03", name: "Departments", access: "full" },
      { moduleId: "43a793d6fea2f370", name: "Tasks", access: "full" },
      { moduleId: "793756e1d0997601", name: "Projects", access: "full" },
      { moduleId: "c826110014caa10e", name: "Workflow (Project & Task Flow)", access: "full" },
      { moduleId: "8bde69403e370854", name: "Notifications", access: "full" },
      { moduleId: "63c9ab2ec626ee63", name: "Reports & Analytics", access: "full" },
      { moduleId: "45fb8742255ce2f7", name: "Document & File Management", access: "full" },
      { moduleId: "435f640487c33b57", name: "Settings & Master Configuration", access: "full" },
      { moduleId: "a814d9abf691c2f9", name: "Chat / Real-Time Collaboration", access: "full" },
      { moduleId: "b32e298a4d889334", name: "Approval Workflows", access: "full" }
    ]
  }
};
