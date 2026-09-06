import { useTranslation } from "react-i18next";

import "./InfoPage.css";

export type InfoPageKey = "help" | "terms" | "privacy";

const SECTIONS: Record<InfoPageKey, string[]> = {
  help: ["booking", "cancelling", "hosting", "account"],
  terms: ["usage", "bookings", "listings", "liability"],
  privacy: ["collected", "usage", "sharing", "rights"],
};

type Props = {
  page: InfoPageKey;
};

export default function InfoPage({ page }: Props) {
  const { t } = useTranslation();

  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">{t(`info.${page}.title`)}</h1>

        <p className="info-page__intro">{t(`info.${page}.intro`)}</p>
      </header>

      <div className="info-page__sections">
        {SECTIONS[page].map((section) => (
          <section key={section} className="info-section">
            <h2 className="info-section__heading">
              {t(`info.${page}.sections.${section}.heading`)}
            </h2>

            <p className="info-section__body">
              {t(`info.${page}.sections.${section}.body`)}
            </p>
          </section>
        ))}
      </div>

      <p className="info-page__note">{t("info.note")}</p>
    </main>
  );
}
