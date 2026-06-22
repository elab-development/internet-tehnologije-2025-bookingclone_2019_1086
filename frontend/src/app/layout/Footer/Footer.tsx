import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./Footer.css";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label="M2 Living home">
            <img
              src="/logo/m2living.png"
              alt="M2 Living"
              className="footer__logo-image"
            />
          </Link>

          <p className="footer__description">
            {t("footer.description")}
          </p>
        </div>

        <div className="footer__columns">
          <div className="footer__column">
            <h3 className="footer__title">{t("footer.navigation")}</h3>

            <Link to="/" className="footer__link">
              {t("nav.home")}
            </Link>

            <Link to="/apartments" className="footer__link">
              {t("nav.apartments")}
            </Link>

            <Link to="/contact" className="footer__link">
              {t("nav.contact")}
            </Link>
          </div>

          <div className="footer__column">
            <h3 className="footer__title">{t("footer.stays")}</h3>

            <Link to="/apartments" className="footer__link">
              {t("footer.availableApartments")}
            </Link>

            <Link to="/reservations" className="footer__link">
              {t("nav.myReservations")}
            </Link>

            <Link to="/host/apartments" className="footer__link">
              {t("nav.myApartments")}
            </Link>
          </div>

          <div className="footer__column">
            <h3 className="footer__title">{t("footer.support")}</h3>

            <Link to="/help" className="footer__link">
              {t("footer.help")}
            </Link>

            <Link to="/terms" className="footer__link">
              {t("footer.terms")}
            </Link>

            <Link to="/privacy" className="footer__link">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <span>
          © {currentYear} M2 Living. {t("footer.rights")}
        </span>
      </div>
    </footer>
  );
}