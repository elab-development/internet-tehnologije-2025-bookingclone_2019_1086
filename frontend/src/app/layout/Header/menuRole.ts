export type MenuItem = {
  labelKey: string;
  to: string;
};

export function getMenuByRole(role: string): MenuItem[] {
  switch (role) {
    case "ADMIN":
      return [{ labelKey: "nav.tagManagement", to: "/admin/tags" }];

    case "HOST":
      return [
        { labelKey: "nav.myApartments", to: "/host/apartments" },
        { labelKey: "nav.reservations", to: "/host/reservations" },
        { labelKey: "nav.statistics", to: "/host/statistika" },
      ];

    default:
      return [{ labelKey: "nav.myReservations", to: "/reservations" }];
  }
}