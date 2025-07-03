"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "@/shared/components/layout/navbar";
import { FloatingNav } from "@/shared/components/layout/floating-nav";
import React from "react";

export default function ClientNavWrapper({ children }: { children: React.ReactNode }) {
  // Try/catch in case of SSR mismatch, fallback to empty string
  let pathname = "";
  try {
    pathname = usePathname?.() || "";
  } catch {
    pathname = "";
  }
  const showNavbar = pathname !== "/" && pathname !== "/landing";
  const hideFloatingNav = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/landing";

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
      {!hideFloatingNav && <FloatingNav />}
    </>
  );
} 