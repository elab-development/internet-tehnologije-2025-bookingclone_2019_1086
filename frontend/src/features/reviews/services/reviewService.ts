import { apiRequest } from "../../../shared/api/apiClient";
import type { BasePagedResponse } from "../../apartments/services/apartmentService";

export const MIN_RATING = 1;
export const MAX_RATING = 10;

export type ReviewDto = {
  id: number;
  reservation_id: number;
  apartment_id: number;
  user_id: number;
  author_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewCreateRequest = {
  reservation_id: number;
  rating: number;
  comment?: string | null;
};

export async function createReview(body: ReviewCreateRequest) {
  return apiRequest<ReviewDto>("/reviews", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function getApartmentReviews(
  apartmentId: number,
  pageNumber: number,
  pageSize: number
) {
  const response = await apiRequest<BasePagedResponse<ReviewDto>>(
    `/apartments/${apartmentId}/reviews?page_number=${pageNumber}&page_size=${pageSize}`,
    { method: "GET" }
  );

  return {
    ...response,
    items: response.items ?? [],
  };
}

export async function deleteReview(reviewId: number) {
  await apiRequest<void>(`/reviews/${reviewId}`, {
    method: "DELETE",
    auth: true,
  });
}
