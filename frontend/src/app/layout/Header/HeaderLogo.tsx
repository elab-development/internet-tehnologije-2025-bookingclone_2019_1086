import { Link } from "react-router-dom";

export default function HeaderLogo() {
  return (
    <Link to="/" className="header__logo">
      Booking.com
    </Link>
  );
}