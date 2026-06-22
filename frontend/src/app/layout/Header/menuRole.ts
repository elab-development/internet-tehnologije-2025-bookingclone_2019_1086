export type MenuItem = {
  label: string;
  to: string;
};

export function getMenuByRole(role: string): MenuItem[] {
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