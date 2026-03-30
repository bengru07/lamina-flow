import { Outlet } from "react-router-dom";
import Navbar from "./navbar";

export default function RootLayout() {
  return <div className="w-screen h-screen bg-background flex flex-col">
    <header className="">
      <Navbar />
    </header>
    <main className="w-full h-full">
      <Outlet />
    </main>
  </div>
}