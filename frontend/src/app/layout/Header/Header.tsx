import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as authService from "../../../features/auth/services/authService";
import {
  getAuthUser,
  isLoggedIn,
  logoutLocal,
} from "../../../features/auth/storage/authStorage";
import AuthModal from "../../../features/auth/components/AuthModal";

import HeaderLogo from "./HeaderLogo";
import HeaderNavigation from "./HeaderNavigation";
import HeaderLanguageSwitcher from "./HeaderLanguageSwitcher";
import GuestActions from "./GuestActions";
import UserMenu from "./UserMenu";
import { getMenuByRole } from "./menuRole";

import "./Header.css";

export default function Header() {
  const navigate = useNavigate();

  const [logged, setLogged] = useState<boolean>(isLoggedIn());
  const [user, setUser] = useState(getAuthUser());

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<"login" | "register">(
    "login"
  );

  const menuItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return getMenuByRole(user.role);
  }, [user]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  function openLogin() {
    setAuthDefaultMode("login");
    setAuthOpen(true);
  }

  function openRegister() {
    setAuthDefaultMode("register");
    setAuthOpen(true);
  }

  function closeAuthModal() {
    setAuthOpen(false);
  }

  function toggleUserMenu() {
    setOpen((value) => !value);
  }

  function closeUserMenu() {
    setOpen(false);
  }

  function getUserRole() {
    if (!user) {
      return undefined;
    }

    return user.role;
  }

  function handleAuthSuccess() {
    setLogged(isLoggedIn());
    setUser(getAuthUser());
    closeAuthModal();
  }

  async function onLogout() {
    try {
      await authService.logout();
    } catch {
      // Ignore backend logout failure.
    } finally {
      logoutLocal();
      setLogged(false);
      setUser(null);
      setOpen(false);
      navigate("/", { replace: true });
    }
  }

  function renderHeaderActions() {
    if (!logged) {
      return (
        <GuestActions
          onLoginClick={openLogin}
          onRegisterClick={openRegister}
        />
      );
    }

    if (!user) {
      return (
        <GuestActions
          onLoginClick={openLogin}
          onRegisterClick={openRegister}
        />
      );
    }

    return (
      <UserMenu
        user={user}
        menuItems={menuItems}
        open={open}
        menuRef={menuRef}
        onToggle={toggleUserMenu}
        onClose={closeUserMenu}
        onLogout={onLogout}
      />
    );
  }

  return (
    <>
      <header className="header">
        <div className="header__top">
          <HeaderLogo />

          <HeaderNavigation logged={logged} role={getUserRole()} />

          <div className="header__actions">
            <HeaderLanguageSwitcher />

            {renderHeaderActions()}
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={closeAuthModal}
        defaultMode={authDefaultMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}