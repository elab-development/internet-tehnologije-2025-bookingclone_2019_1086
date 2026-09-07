from datetime import date, datetime, UTC
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func

from app.enums.reservation_status_enum import ReservationStatus
from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.models.review import Review
from app.models.user import User
from app.shared.errors import bad_request, forbidden, not_found
from app.features.reviews.schemas import ReviewDto


def utcnow() -> datetime:
    return datetime.utcnow()


def today() -> date:
    return datetime.now(UTC).date()


def map_review_to_dto(review: Review, author_name: Optional[str]) -> ReviewDto:
    return ReviewDto(
        id=review.id,
        reservation_id=review.reservation_id,
        apartment_id=review.apartment_id,
        user_id=review.user_id,
        author_name=author_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


async def load_reviewable_reservation(
    session: AsyncSession, reservation_id: int, current_user: User
) -> Reservation:
    """The stay a review is being written for, or the reason it cannot be.

    Three things have to hold: the stay is yours, the host accepted it, and it
    is over. A booking that was declined or that has not happened yet is not
    something anyone can have an opinion about.
    """
    reservation = await session.get(Reservation, reservation_id)

    if not reservation:
        raise not_found("reservation_not_found", "Reservation not found")

    if reservation.user_id != current_user.id:
        raise forbidden("review_not_your_stay", "You can only review your own stay")

    if reservation.status != ReservationStatus.CONFIRMED.value:
        raise bad_request(
            "review_not_confirmed", "Only a confirmed reservation can be reviewed"
        )

    if reservation.check_out > today():
        raise bad_request(
            "review_stay_not_over", "You can review the stay after checking out"
        )

    return reservation


async def get_review_for_reservation(
    session: AsyncSession, reservation_id: int
) -> Optional[Review]:
    query = select(Review).where(Review.reservation_id == reservation_id)

    return (await session.exec(query)).first()


async def upsert_review(
    session: AsyncSession,
    reservation: Reservation,
    rating: int,
    comment: Optional[str],
) -> Review:
    """One review per stay, so a second write changes the first one.

    Saves the guest from being stuck with a misclicked score, and keeps the
    unique key on reservation_id from ever being hit.
    """
    review = await get_review_for_reservation(session, reservation.id)

    if review:
        review.rating = rating
        review.comment = comment
        review.updated_at = utcnow()
    else:
        review = Review(
            reservation_id=reservation.id,
            apartment_id=reservation.apartment_id,
            user_id=reservation.user_id,
            rating=rating,
            comment=comment,
        )

    session.add(review)

    return review


async def recalculate_apartment_rating(
    session: AsyncSession, apartment_id: int
) -> None:
    """Write the average and the count back onto the apartment.

    Kept on the apartment row rather than counted on every read, because the
    apartment list shows it for every card and the search filters by it. Runs
    in the same transaction as the review, so the two can never disagree.
    """
    query = select(func.avg(Review.rating), func.count(Review.id)).where(
        Review.apartment_id == apartment_id
    )

    average, count = (await session.exec(query)).one()

    apartment = await session.get(Apartment, apartment_id)

    if not apartment:
        return

    if count:
        apartment.rating_average = Decimal(str(average)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
    else:
        apartment.rating_average = None

    apartment.reviews_count = count

    session.add(apartment)


async def load_apartment_for_reviews(
    session: AsyncSession, apartment_id: int
) -> Apartment:
    query = (
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .where(Apartment.deleted_at.is_(None))
    )

    apartment = (await session.exec(query)).first()

    if not apartment:
        raise not_found("apartment_not_found", "Apartment not found")

    return apartment
