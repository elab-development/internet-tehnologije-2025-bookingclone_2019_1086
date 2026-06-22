import { Link } from "react-router-dom";

export default function HeaderLogo() {
  return (
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
  );
}