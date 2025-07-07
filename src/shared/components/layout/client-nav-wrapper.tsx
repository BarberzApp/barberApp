"use client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/shared/components/layout/navbar";
import { FloatingNav } from "@/shared/components/layout/floating-nav";
import React from "react";

export default function ClientNavWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pathname, setPathname] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
  }, []);

  const showNavbar = mounted && pathname !== "/" && pathname !== "/landing";
  const hideFloatingNav = mounted && (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/landing");

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
      {!hideFloatingNav && <FloatingNav />}
    </>
  );
} 