import { ModeToggle } from "@/components/mode-toggle";
import NavBreadcrumb from "./nav-breadcrumb";

export default function Navbar() {
  return <>
    <nav className="w-full h-13 text-sm border-b fixed">
      <div className="w-full h-full flex flex-row justify-between items-center p-2">
        <div className="w-full">
          <NavBreadcrumb className="mt-1" />
        </div>
        <div className="">
          <ModeToggle />
        </div>
      </div>
    </nav>
    <div className="h-13" />
  </>
}