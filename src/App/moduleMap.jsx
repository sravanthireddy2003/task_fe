// moduleMap.js - ✅ Pure JavaScript (no JSX)
import React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";

// ✅ Factory function creates JSX elements
const createIcon = (IconComponent) => <IconComponent />;

export const MODULE_MAP = {
  "Dashboard": { 
    label: "Dashboard", 
    link: "/dashboard", 
    icon: createIcon(DashboardRoundedIcon)
  },
  "User Management": { 
    label: "Users & Teams", 
    link: "/users", 
    icon: createIcon(GroupsRoundedIcon)
  },
  "Clients": { 
    label: "Clients", 
    link: "/clients", 
    icon: createIcon(BusinessCenterRoundedIcon)
  },
  "Departments": { 
    label: "Departments", 
    link: "/departments", 
    icon: createIcon(ApartmentRoundedIcon)
  },
  "Projects": { 
    label: "Projects", 
    link: "/projects", 
    icon: createIcon(WorkOutlineRoundedIcon)
  },
  "Tasks": { 
    label: "Tasks", 
    link: "/tasks", 
    icon: createIcon(ChecklistRoundedIcon)
  },
  "Reports & Analytics": { 
    label: "Analytics", 
    link: "/reports", 
    icon: createIcon(InsightsRoundedIcon)
  },
  "Document & File Management": { 
    label: "Documents", 
    link: "/documents", 
    icon: createIcon(ChecklistRoundedIcon)
  },
  "Settings & Master Configuration": { 
    label: "Settings", 
    link: "/settings", 
    icon: createIcon(SettingsRoundedIcon)
  },
  "Chat / Real-Time Collaboration": { 
    label: "Chat", 
    link: "/chat", 
    icon: createIcon(ChatBubbleRoundedIcon)
  },
  "Workflow (Project & Task Flow)": { 
    label: "Workflow", 
    link: "/workflow", 
    icon: createIcon(AutoGraphRoundedIcon)
  },
  "Notifications": { 
    label: "Notifications", 
    link: "/notifications", 
    icon: createIcon(NotificationsRoundedIcon)
  },
  "Approval Workflows": { 
    label: "Approvals", 
    link: "/approvals", 
    icon: createIcon(ApprovalRoundedIcon)
  },
};
