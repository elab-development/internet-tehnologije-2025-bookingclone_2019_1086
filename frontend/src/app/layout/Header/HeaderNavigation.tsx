import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  logged: boolean;
  role?: string;
};

type NavigationItem = {
  labelKey: string;
  to: string;
};

function getNavigationItems(logged: boolean, role?: string): NavigationItem[] {
  const baseItems: NavigationItem[] = [
    { labelKey: "nav.home", to: "/" },
    { labelKey: "nav.apartments", to: "/apartments" },
  ];

  if (logged && role === "HOST") {
    return [
      ...baseItems,
      { labelKey: "nav.myApartments", to: "/host/apartments" },
      { labelKey: "nav.reservations", to: "/host/reservations" },
      { labelKey: "nav.contact", to: "/contact" },
    ];
  }

  if (logged && role === "ADMIN") {
    return [
      ...baseItems,
      { labelKey: "nav.adminPanel", to: "/admin/apartments" },
      { labelKey: "nav.contact", to: "/contact" },
    ];
  }

  if (logged) {
    return [
      ...baseItems,
      { labelKey: "nav.myReservations", to: "/reservations" },
      { labelKey: "nav.contact", to: "/contact" },
    ];
  }

  return [...baseItems, { labelKey: "nav.contact", to: "/contact" }];
}

export default function HeaderNavigation({ logged, role }: Props) {
  const { t } = useTranslation();

  const navigationItems = getNavigationItems(logged, role);

  return (
    <nav className="header__navigation" aria-label="Main navigation">
      {navigationItems.map((item) => (
        <Link key={item.to} to={item.to} className="header__navigation-item">
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}