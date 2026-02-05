import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../services/authService";
import { getAuthUser, isLoggedIn, logoutLocal } from "../auth/authStorage";
import AuthModal from "./auth/AuthModal"; 

type MenuItem = {
  label: string;
  to: string;
};

function getMenuByRole(role: string): MenuItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { label: "Apartment management", to: "/admin/apartments" },
        { label: "Tag management", to: "/admin/tags" },
        { label: "User management", to: "/admin/users" },
      ];

    case "HOST":
      return [
        { label: "My apartments", to: "/host/apartments" },
        { label: "Reservations", to: "/host/reservations" },
        { label: "Payments", to: "/host/payments" },
      ];

    default:
      return [
        { label: "My reservations", to: "/me/reservations" },
        { label: "Account details", to: "/me/account" },
      ];
  }
}

export default function Header() {
  const navigate = useNavigate();

  //  Make auth state reactive (not "const logged = isLoggedIn()" once)
  const [logged, setLogged] = useState<boolean>(isLoggedIn());
  const [user, setUser] = useState(getAuthUser());

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  //  Auth modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<
    "login" | "register"
  >("login");

  const menuItems = useMemo(() => {
    return user ? getMenuByRole(user.role) : [];
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openLogin() {
    setAuthDefaultMode("login");
    setAuthOpen(true);
  }

  function openRegister() {
    setAuthDefaultMode("register");
    setAuthOpen(true);
  }

  function handleAuthSuccess() {
    //  forms already save token+user to local storage
    setLogged(isLoggedIn());
    setUser(getAuthUser());
    setAuthOpen(false);
  }

  async function onLogout() {
    try {
      await authService.logout();
    } catch {
      // ignore backend failure
    } finally {
      logoutLocal();
      setLogged(false);
      setUser(null);
      setOpen(false);
      navigate("/", { replace: true }); // go home, not /login page
    }
  }

  return (
    <>
      <header style={{ backgroundColor: "#003580", color: "#fff" }}>
        {/* Top bar */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Booking.com
          </Link>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600 }}>RSD</span>

            {!logged ? (
              <>
                <button
                  type="button"
                  onClick={openRegister}
                  style={{
                    background: "#fff",
                    color: "#003580",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Register
                </button>

                <button
                  type="button"
                  onClick={openLogin}
                  style={{
                    background: "#fff",
                    color: "#003580",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <div ref={menuRef} style={{ position: "relative" }}>
                {/* Profile button */}
                <button
                  onClick={() => setOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 999,
                    padding: "6px 10px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {/* Avatar */}
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </span>

                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {user?.role}
                  </span>

                  <span style={{ opacity: 0.8 }}>▾</span>
                </button>

                {/* Dropdown */}
                {open && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 10px)",
                      width: 240,
                      background: "#fff",
                      color: "#111827",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 18px 40px rgba(16,24,40,0.18)",
                      overflow: "hidden",
                      zIndex: 50,
                    }}
                  >
                    <div
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #eef2f7",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{user?.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {user?.email}
                      </div>
                    </div>

                    <div style={{ padding: 6 }}>
                      {menuItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          style={{
                            display: "block",
                            padding: "10px",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 14,
                            textDecoration: "none",
                            color: "#111827",
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}

                      <button
                        onClick={onLogout}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px",
                          borderRadius: 10,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 14,
                          color: "#b42318",
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation tabs */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px 16px",
            display: "flex",
            gap: 24,
            fontWeight: 600,
          }}
        >
          <span>Stays</span>
          <span>Flights</span>
          <span>Car rental</span>
          <span>Attractions</span>
          <span>Airport taxis</span>
        </div>
      </header>

      {/* Auth modal mounted once */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authDefaultMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
