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
    if (typeof window !== 'undefined') {
      console.log('Current pathname:', window.location.pathname);
    }
  }, []);

  const showNavbar = mounted && !["/", "/landing", "/login", "/register", "/barber/onboarding"].includes(pathname);
  const hideFloatingNav = mounted && (["/", "/login", "/register", "/landing", "/profile"].includes(pathname) || pathname.startsWith('/settings/barber-profile') || pathname.startsWith('/profile'));
  const showMobileNav = mounted && !["/", "/landing", "/login", "/register", "/barber/onboarding"].includes(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <div className={showMobileNav ? "pb-20 md:pb-0" : ""}>
        {children}
      </div>
      {/* Only show floating nav on desktop (md and up) */}
      {!hideFloatingNav && (
        <div className="hidden md:block">
          <FloatingNav />
        </div>
      )}
    </>
  );
} 