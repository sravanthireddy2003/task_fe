import React from "react";
import * as Icons from "../icons";

const {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  CheckSquare,
  BarChart3,
  FileText,
  Settings,
  MessageSquare,
  Workflow,
  Bell,
  RefreshCw,
} = Icons;

// Factory function creates JSX elements with consistent size/style
const createIcon = (IconComponent) => <IconComponent className="tm-icon" strokeWidth={1.8} />;

export const MODULE_MAP = {
  "Dashboard": { 
    label: "Dashboard", 
    link: "/dashboard", 
    icon: createIcon(LayoutDashboard)
  },
  "User Management": { 
    label: "Users & Teams", 
    link: "/users", 
    icon: createIcon(Users)
  },
  "Clients": { 
    label: "Clients", 
    link: "/clients", 
    icon: createIcon(BriefcaseBusiness)
  },
  "Departments": { 
    label: "Departments", 
    link: "/departments", 
    icon: createIcon(Building2)
  },
  "Projects": { 
    label: "Projects", 
    link: "/projects", 
    icon: createIcon(FolderKanban)
  },
  "Tasks": { 
    label: "Tasks", 
    link: "/tasks", 
    icon: createIcon(CheckSquare)
  },
  "Reports & Analytics": { 
    label: "Analytics", 
    link: "/reports", 
    icon: createIcon(BarChart3)
  },
  "Document & File Management": { 
    label: "Documents", 
    link: "/documents", 
    icon: createIcon(FileText)
  },
  "Assigned Tasks": {
    label: "Assigned Tasks",
    link: "/tasks",
    icon: createIcon(CheckSquare)
  },
  "Settings & Master Configuration": { 
    label: "Settings", 
    link: "/settings", 
    icon: createIcon(Settings)
  },
  "Chat / Real-Time Collaboration": { 
    label: "Chat", 
    link: "/chat", 
    icon: createIcon(MessageSquare)
  },
  "Workflow (Project & Task Flow)": { 
    label: "Workflow", 
    link: "/workflow", 
    icon: createIcon(Workflow)
  },
  "Notifications": { 
    label: "Notifications", 
    link: "/notifications", 
    icon: createIcon(Bell)
  },
  "Approval Workflows": { 
    label: "Approvals", 
    link: "/approvals", 
    icon: createIcon(CheckSquare)
  },
  "Task Reassignment Requests": {
    label: "Reassignment",
    link: "/task-reassignment-requests",
    icon: createIcon(RefreshCw),
    description: "Manage employee requests to reassign tasks",
  },
};
