"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAppSelector } from "@/api/appDispatcher"
import { RootState } from "@/redux/store"

interface DynamicBreadcrumbsProps {
  baseRoute?: string
  baseLabel?: string
  skipFirstN?: number
  hideSegments?: string[]
}

export function DynamicBreadcrumbs({
  baseRoute = "/",
  baseLabel = "Home",
  skipFirstN = 0,
  hideSegments = []
}: DynamicBreadcrumbsProps) {
  const pathname = usePathname()
  const workspaces = useAppSelector((state: RootState) => state.workspaces.list)
  
  const segments = pathname.split("/").filter(Boolean)
  const baseSegments = baseRoute.split("/").filter(Boolean)
  
  const relativeSegments = segments.slice(baseSegments.length)

  const breadcrumbs = relativeSegments
    .map((segment, index) => {
      const href = `/${[...baseSegments, ...relativeSegments.slice(0, index + 1)].join("/")}`
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

      if (isUUID) {
        const project = workspaces.find((w: any) => w.uuid === segment)
        if (project) {
          label = project.name
        }
      }

      return {
        href,
        label,
        segment,
        isLast: index === relativeSegments.length - 1,
      }
    })
    .filter((crumb, index) => {
      if (index < skipFirstN) return false
      
      const isPlainNumericID = /^\d+$/.test(crumb.segment)
      if (isPlainNumericID) return false
      
      if (hideSegments.some(s => s.toLowerCase() === crumb.segment.toLowerCase())) return false

      return true
    })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={baseRoute}>{baseLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}