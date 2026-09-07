import { useEffect, useState } from "react";

import { getMyApartments } from "../../../apartments/services/apartmentService";

export type ApartmentOption = {
  id: number;
  title: string;
};

const PAGE_SIZE = 50;
const MAX_PAGES = 10;

export function useHostApartmentOptions(enabled: boolean = true) {
  const [options, setOptions] = useState<ApartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        const collected: ApartmentOption[] = [];
        let page = 1;

        while (page <= MAX_PAGES) {
          const response = await getMyApartments({
            page_number: page,
            page_size: PAGE_SIZE,
          });

          response.items.forEach((apartment) => {
            collected.push({ id: apartment.id, title: apartment.title });
          });

          if (collected.length >= response.total || response.items.length === 0) {
            break;
          }

          page += 1;
        }

        if (!cancelled) {
          setOptions(collected);
        }
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { options, isLoading };
}
