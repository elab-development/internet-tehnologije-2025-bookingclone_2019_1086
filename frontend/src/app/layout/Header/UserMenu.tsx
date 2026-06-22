import type { RefObject } from "react";
import { Link } from "react-router-dom";

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
  const avatarLetter = user.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div ref={menuRef} className="header__user-menu">
      <button
        type="button"
        onClick={onToggle}
        className="header__profile-button"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="header__avatar">{avatarLetter}</span>

        <span className="header__user-role">{user.role}</span>

        <span className="header__dropdown-icon">▾</span>
      </button>

      {open ? (
        <div className="header__dropdown" role="menu">
          <div className="header__dropdown-user">
            <div className="header__dropdown-name">{user.name}</div>
            <div className="header__dropdown-email">{user.email}</div>
          </div>

          <div className="header__dropdown-list">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="header__dropdown-link"
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={onLogout}
              className="header__logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}