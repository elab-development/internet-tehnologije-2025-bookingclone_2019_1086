import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Pagination from "../../../shared/components/Pagination";
import { getApartmentReviews, type ReviewDto } from "../services/reviewService";
import { formatRating, parseRating, ratingWordKey } from "../utils/ratingFormat";

import "../styles/Reviews.css";

type Props = {
  apartmentId: number;
  ratingAverage: string | number | null;
  reviewsCount: number;
};

const PAGE_SIZE = 5;

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");

  return `${day}.${month}.${parsed.getFullYear()}.`;
}

export default function ApartmentReviews({
  apartmentId,
  ratingAverage,
  reviewsCount,
}: Props) {
  const { t } = useTranslation();

  const [items, setItems] = useState<ReviewDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loaded = await getApartmentReviews(apartmentId, page, PAGE_SIZE);
      setItems(loaded.items);
      setTotal(loaded.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("reviews.errors.loadFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }, [apartmentId, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  function renderScore() {
    const score = parseRating(ratingAverage);

    if (score === null || reviewsCount === 0) {
      return <p className="reviews__empty">{t("reviews.noRating")}</p>;
    }

    const wordKey = ratingWordKey(score);

    return (
      <div className="reviews__score">
        <span className="reviews__score-value">{formatRating(score)}</span>

        <div className="reviews__score-text">
          <span className="reviews__score-word">
            {wordKey ? t(`reviews.words.${wordKey}`) : ""}
          </span>

          <span className="reviews__score-count">
            {t("reviews.count", { count: reviewsCount })}
          </span>
        </div>
      </div>
    );
  }

  function renderList() {
    if (isLoading) {
      return <p className="reviews__state">{t("reviews.loading")}</p>;
    }

    if (error) {
      return <p className="reviews__state reviews__state--error">{error}</p>;
    }

    if (items.length === 0) {
      return null;
    }

    return (
      <ul className="reviews__list">
        {items.map((review) => (
          <li key={review.id} className="reviews__item">
            <div className="reviews__item-head">
              <span className="reviews__item-score">{review.rating}</span>

              <span className="reviews__item-author">
                {review.author_name ?? t("reviews.anonymous")}
              </span>

              <span className="reviews__item-date">
                {formatDate(review.created_at)}
              </span>
            </div>

            {review.comment ? (
              <p className="reviews__item-comment">{review.comment}</p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="reviews">
      <h2 className="reviews__title">{t("reviews.title")}</h2>

      {renderScore()}
      {renderList()}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        disabled={isLoading}
        onPageChange={setPage}
      />
    </section>
  );
}
