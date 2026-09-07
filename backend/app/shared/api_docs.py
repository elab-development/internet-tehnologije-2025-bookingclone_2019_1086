"""Everything the generated OpenAPI document needs and the code itself does not.

FastAPI writes the specification from the routes, so whatever is missing in the
code is missing on `/docs` as well. Two things never make it there on their own:
what the API is, and how it fails. Both live here, in one place, so a route only
has to say which errors it can raise.
"""

from typing import Any

from pydantic import BaseModel, Field


API_TITLE = "Booking Clone API"

API_VERSION = "1.0.0"

API_DESCRIPTION = """
REST API za aplikaciju za rezervaciju apartmana.

Tri uloge: **USER** rezerviše, **HOST** izdaje i vodi svoje apartmane,
**ADMIN** upravlja šifarnicima.

**Autentifikacija.** Prijava vraća *access token* koji traje 15 minuta i putuje
u zaglavlju `Authorization: Bearer <token>`. Uz njega ide i *refresh token*, ali
on stoji u `httponly` kolačiću i ne čita se iz JavaScript-a; `POST /auth/refresh`
ga troši i izdaje nov par, pa jedan refresh token vredi tačno jednom.

U Swagger UI-ju se prijavljujete dugmetom **Authorize**, unosom email adrese i
lozinke.

**Greške.** Svaka greška ima isti oblik: `detail` je rečenica na engleskom,
`code` je stabilna oznaka koju frontend prevodi na jezik korisnika, a `params`
nosi vrednosti koje ulaze u prevedenu rečenicu. Zahvaljujući tome poruka o
grešci nikad nije sklopljena od engleskih parčića unutar srpske rečenice.
""".strip()


TAGS_METADATA = [
    {
        "name": "auth",
        "description": (
            "Registracija, prijava, odjava i osvežavanje sesije. `GET /auth/me` "
            "vraća prijavljenog korisnika i koristi se za proveru tokena."
        ),
    },
    {
        "name": "apartments",
        "description": (
            "Apartmani: javna pretraga sa filterima, kalendar zauzetih dana i "
            "upravljanje sopstvenim apartmanima za ulogu HOST. Brisanje je meko "
            "(*soft delete*) — red ostaje u bazi da bi stare rezervacije i dalje "
            "pokazivale na postojeći apartman."
        ),
    },
    {
        "name": "apartments_photo",
        "description": (
            "Slike apartmana. Otpremanje i brisanje sme samo vlasnik apartmana; "
            "same slike se posle čitaju kao statički fajlovi sa `/static`."
        ),
    },
    {
        "name": "tags",
        "description": (
            "Šifarnik oznaka (Wi-Fi, parking, klima). Čitanje je javno, izmene "
            "su dozvoljene samo ulozi ADMIN."
        ),
    },
    {
        "name": "reservations",
        "description": (
            "Rezervacije. Gost pravi zahtev, domaćin ga potvrđuje ili odbija. "
            "Rute `/reservations/link/{token}` stoje iza linka iz mejla: token "
            "kaže samo o kojoj je rezervaciji reč, a ko sme da je vidi odlučuje "
            "prijava, ne posedovanje linka."
        ),
    },
    {
        "name": "stats",
        "description": (
            "Zarada domaćina po periodu i po apartmanu. Računaju se samo "
            "potvrđene rezervacije, a rezervacija pripada periodu svog dolaska."
        ),
    },
    {
        "name": "health",
        "description": "Provera da li aplikacija radi.",
    },
]


class ErrorResponse(BaseModel):
    """The one shape every failed request comes back in.

    Built by `ExceptionHandlers`, which is the only place that knows what an
    error looks like on the wire. Declaring it here as well is what puts it in
    the specification, where it is otherwise invisible.
    """

    detail: str = Field(description="Rečenica na engleskom, čitljiva i bez prevoda.")
    code: str = Field(description="Stabilna oznaka greške koju frontend prevodi.")
    params: dict[str, Any] = Field(
        default_factory=dict,
        description="Vrednosti koje ulaze u prevedenu poruku, npr. `max_guests`.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "detail": "This apartment allows at most 4 guests",
                "code": "too_many_guests",
                "params": {"max_guests": 4},
            }
        }
    }


ERROR_DESCRIPTIONS = {
    400: "Zahtev je neispravan, npr. datum odjave pre datuma prijave.",
    401: "Niste prijavljeni ili je token istekao.",
    403: "Prijavljeni ste, ali nemate pravo na ovu radnju.",
    404: "Traženi resurs ne postoji.",
    409: "Sudar sa postojećim stanjem, npr. datumi su već zauzeti.",
    410: "Link je istekao i više ne važi.",
}


def error_responses(*status_codes: int) -> dict[int, dict[str, Any]]:
    """Declare which errors a route can answer with.

    Written as `responses=error_responses(401, 404)` on the route. Without it
    the specification claims every route only ever returns success or a
    validation error, which is the single biggest thing missing from a
    generated document.
    """
    return {
        code: {
            "model": ErrorResponse,
            "description": ERROR_DESCRIPTIONS[code],
        }
        for code in status_codes
    }


# The two that show up on nearly every protected route, spelled out once.
AUTH_ERRORS = (401, 403)
