import { Bell, Box, Home, Layers, Search, UserCircle, Users } from "lucide-react";

export const sidebarConfig = {
  main: [
    { icon: Home, url: "/application", label: "Home" },
    { icon: Box, url: "/application/builder", label: "Builder" },
    { icon: Layers, url: "/application/deployments", label: "Deployments" },
  ],
  footer: [
    { icon: Bell, url: "/notifications", label: "Notifications" },
    { icon: UserCircle, url: "/profile", label: "Profile" },
  ],
};
