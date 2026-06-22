import { Link } from "react-router-dom";

export default function HeaderLogo() {
  return (
    <Link to="/" className="header__logo" aria-label="M2 Living home">
      <img
        src="/logo/m2living.png"
        alt="M2 Living"
        className="header__logo-image"
      />
    </Link>
  );
}