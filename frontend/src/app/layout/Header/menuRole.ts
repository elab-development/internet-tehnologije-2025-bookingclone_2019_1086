export type MenuItem = {
  labelKey: string;
  to: string;
};

export function getMenuByRole(role: string): MenuItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { labelKey: "nav.apartmentManagement", to: "/admin/apartments" },
        { labelKey: "nav.tagManagement", to: "/admin/tags" },
        { labelKey: "nav.userManagement", to: "/admin/users" },
      ];

    case "HOST":
      return [
        { labelKey: "nav.myApartments", to: "/host/apartments" },
        { labelKey: "nav.reservations", to: "/host/reservations" },
        { labelKey: "nav.payments", to: "/host/payments" },
      ];

    default:
      return [
        { labelKey: "nav.accountDetails", to: "/account" },
        { labelKey: "nav.myReservations", to: "/reservations" },
      ];
  }
}