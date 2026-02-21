'use client';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumb"
import { Provider } from "react-redux"
import { store } from "@/redux/store"
import { useAppSelector } from "@/api/appDispatcher";
import AppNavbar from "@/components/app-navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          <AppSidebar />
          <main className="flex flex-col flex-1 min-h-screen">
            <AppNavbar />
            <div className="flex-1">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  )
}