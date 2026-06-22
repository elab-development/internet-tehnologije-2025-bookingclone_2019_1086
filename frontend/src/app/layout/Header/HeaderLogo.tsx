import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HeaderLogo() {
  const { t } = useTranslation();

  return (
    <Link to="/" className="header__logo">
      {t("app.name")}
    </Link>
  );
}