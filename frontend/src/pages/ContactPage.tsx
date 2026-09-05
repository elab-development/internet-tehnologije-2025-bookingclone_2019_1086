import { useTranslation } from "react-i18next";

import "./ContactPage.css";

const CONTACT_EMAIL = "podrska@m2living.rs";
const CONTACT_PHONE = "+381 11 123 4567";
const CONTACT_ADDRESS = "Knez Mihailova 1, Beograd, Srbija";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <main className="contact-page">
      <header className="contact-page__header">
        <h1 className="contact-page__title">{t("contact.title")}</h1>

        <p className="contact-page__subtitle">{t("contact.subtitle")}</p>
      </header>

      <div className="contact-page__grid">
        <section className="contact-card">
          <h2 className="contact-card__title">{t("contact.email")}</h2>

          <a className="contact-card__value" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>

          <p className="contact-card__note">{t("contact.emailNote")}</p>
        </section>

        <section className="contact-card">
          <h2 className="contact-card__title">{t("contact.phone")}</h2>

          <a
            className="contact-card__value"
            href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
          >
            {CONTACT_PHONE}
          </a>

          <p className="contact-card__note">{t("contact.phoneNote")}</p>
        </section>

        <section className="contact-card">
          <h2 className="contact-card__title">{t("contact.address")}</h2>

          <p className="contact-card__value">{CONTACT_ADDRESS}</p>

          <p className="contact-card__note">{t("contact.addressNote")}</p>
        </section>
      </div>
    </main>
  );
}
