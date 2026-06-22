import { Link } from "react-router-dom";
import type { RefObject } from "react";

import type { MenuItem } from "./menuRole";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Props = {
  user: User;
  menuItems: MenuItem[];
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
};

export default function UserMenu({
  user,
  menuItems,
  open,
  menuRef,
  onToggle,
  onClose,
  onLogout,
}: Props) {
  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={onToggle}
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
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </span>

        <span style={{ fontWeight: 700, fontSize: 14 }}>{user.role}</span>

        <span style={{ opacity: 0.8 }}>▾</span>
      </button>

      {open ? (
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
            <div style={{ fontWeight: 800 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{user.email}</div>
          </div>

          <div style={{ padding: 6 }}>
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
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
              type="button"
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
      ) : null}
    </div>
  );
}