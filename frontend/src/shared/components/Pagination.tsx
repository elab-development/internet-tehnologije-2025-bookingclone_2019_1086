import { useTranslation } from "react-i18next";

import "./Pagination.css";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

const MAX_VISIBLE_PAGES = 5;

export function getPageCount(total: number, pageSize: number) {
  if (pageSize <= 0) {
    return 0;
  }

  return Math.ceil(total / pageSize);
}

/** Keeps the current page in the middle of a fixed-size window of page numbers. */
function buildVisiblePages(page: number, pageCount: number) {
  if (pageCount <= MAX_VISIBLE_PAGES) {
    return buildRange(1, pageCount);
  }

  const half = Math.floor(MAX_VISIBLE_PAGES / 2);

  let start = page - half;
  let end = page + half;

  if (start < 1) {
    start = 1;
    end = MAX_VISIBLE_PAGES;
  }

  if (end > pageCount) {
    end = pageCount;
    start = pageCount - MAX_VISIBLE_PAGES + 1;
  }

  return buildRange(start, end);
}

function buildRange(start: number, end: number) {
  const pages: number[] = [];

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  return pages;
}

export default function Pagination({
  page,
  pageSize,
  total,
  disabled = false,
  onPageChange,
}: Props) {
  const { t } = useTranslation();

  const pageCount = getPageCount(total, pageSize);

  if (pageCount <= 1) {
    return null;
  }

  const visiblePages = buildVisiblePages(page, pageCount);
  const firstVisiblePage = visiblePages[0];
  const lastVisiblePage = visiblePages[visiblePages.length - 1];

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function goToPage(next: number) {
    if (disabled) {
      return;
    }

    if (next < 1 || next > pageCount || next === page) {
      return;
    }

    onPageChange(next);
  }

  function renderPageButton(value: number) {
    const isCurrent = value === page;

    return (
      <li key={value}>
        <button
          type="button"
          className={
            isCurrent
              ? "pagination__button pagination__button--current"
              : "pagination__button"
          }
          aria-label={t("pagination.page", { page: value })}
          aria-current={isCurrent ? "page" : undefined}
          disabled={disabled}
          onClick={() => goToPage(value)}
        >
          {value}
        </button>
      </li>
    );
  }

  function renderGap(key: string) {
    return (
      <li key={key} className="pagination__gap" aria-hidden="true">
        …
      </li>
    );
  }

  return (
    <nav className="pagination" aria-label={t("pagination.ariaLabel")}>
      <p className="pagination__summary">
        {t("pagination.summary", { from, to, total })}
      </p>

      <ul className="pagination__list">
        <li>
          <button
            type="button"
            className="pagination__button pagination__button--step"
            disabled={disabled || page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            {t("pagination.previous")}
          </button>
        </li>

        {firstVisiblePage > 1 ? renderPageButton(1) : null}
        {firstVisiblePage > 2 ? renderGap("gap-start") : null}

        {visiblePages.map(renderPageButton)}

        {lastVisiblePage < pageCount - 1 ? renderGap("gap-end") : null}
        {lastVisiblePage < pageCount ? renderPageButton(pageCount) : null}

        <li>
          <button
            type="button"
            className="pagination__button pagination__button--step"
            disabled={disabled || page >= pageCount}
            onClick={() => goToPage(page + 1)}
          >
            {t("pagination.next")}
          </button>
        </li>
      </ul>
    </nav>
  );
}
