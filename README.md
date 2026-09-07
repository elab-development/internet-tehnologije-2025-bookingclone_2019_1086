# Booking Clone

Veb aplikacija za izdavanje i rezervaciju apartmana, rađena kao projekat iz
predmeta Internet tehnologije.

Gost pretražuje apartmane po gradu, ceni, broju gostiju i slobodnim datumima,
rezerviše termin i posle boravka ostavlja ocenu. Domaćin dodaje i menja svoje
apartmane, odgovara na zahteve za rezervaciju i prati zaradu kroz grafikone.
Administrator upravlja šifarnikom oznaka.

## Tehnologije

| | |
|---|---|
| Backend | Python, FastAPI, SQLModel, Alembic, SQLite |
| Frontend | React 19, TypeScript, Vite, Bootstrap |
| Ostalo | Leaflet (mapa), Recharts (grafikoni), i18next (prevodi) |

## Šta je potrebno

Za pokretanje kroz Docker dovoljan je samo Docker. Za pokretanje bez njega
trebaju Python 3.10 ili noviji i Node.js 18 ili noviji.

---

## Pokretanje kroz Docker

Najkraći put, ne traži ni Python ni Node na računaru:

```bash
docker compose up --build
```

Aplikacija je na `http://localhost:3000`, API na `http://localhost:8000`.
Migracije se izvršavaju same pri podizanju kontejnera, a oznake za apartmane se
upisuju pri pokretanju aplikacije, pa baza kreće spremna za rad.

Gašenje:

```bash
docker compose down            # zaustavi, zadrži podatke
docker compose down -v         # zaustavi i obriši bazu i otpremljene slike
```

**Podaci žive na volumenima**, ne u samom kontejneru: `db-data` drži SQLite bazu,
a `apartment-images` otpremljene slike. Zato oba prežive `docker compose down` i
ponovnu gradnju slika, i brišu se tek uz `-v`.

Podrazumevana podešavanja su dovoljna za lokalni rad i **mejlovi su isključeni**,
da podizanje kontejnera nikom ne pošalje poruku. Ako želite svoje vrednosti,
napravite `.env` u korenu projekta; `docker-compose.yml` ga čita sam:

```
JWT_SECRET=nesto_dugacko_i_nasumicno
REFRESH_HASH_PEPPER=jos_jedan_nasumican_niz
MAIL_ENABLED=true
SMTP_HOST=smtp.zoho.eu
SMTP_USERNAME=vasa.adresa@zohomail.eu
SMTP_PASSWORD=lozinka_za_aplikaciju
```

Adresa API-ja se u frontend upisuje **pri gradnji**, ne pri pokretanju, jer je
Vite ugrađuje u sam paket. Ako aplikacija ne stoji na `localhost`, prosledite
drugu adresu i ponovo izgradite:

```bash
VITE_API_BASE_URL=http://192.168.1.10:8000 docker compose up --build
```

---

## Pokretanje backenda

Ovo je put bez Docker-a, ako vam treba `--reload` i rad direktno u kodu.

Sve komande se izvršavaju iz foldera `backend`.

**1. Virtuelno okruženje**

```bash
cd backend
python -m venv venv
```

Aktivacija:

```bash
venv\Scripts\Activate.ps1     # Windows PowerShell
venv\Scripts\activate.bat     # Windows CMD
source venv/bin/activate      # macOS / Linux
```

**2. Zavisnosti**

```bash
pip install "fastapi[standard]" sqlmodel aiosqlite passlib PyJWT email-validator bcrypt==4.3.0 uvicorn alembic python-dotenv
```

**3. Podešavanja**

Napravite fajl `backend/.env` po uzoru na `backend/.env example` i popunite
prave vrednosti. Aplikacija se **neće pokrenuti** bez ovih promenljivih:

```
DATABASE_URL=sqlite+aiosqlite:///./database.db
JWT_SECRET=dovoljno_dug_nasumican_niz
JWT_ALG=HS256
ACCESS_TTL_MIN=15
REFRESH_TTL_DAYS=14
REFRESH_COOKIE_NAME=refresh_token
REFRESH_COOKIE_PATH=/auth
REFRESH_HASH_PEPPER=jos_jedan_nasumican_niz
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

Ostale promenljive iz `.env example` imaju podrazumevane vrednosti i nisu
obavezne. Ako ne želite da aplikacija zaista šalje mejlove, stavite
`MAIL_ENABLED=false`.

**4. Baza**

```bash
alembic upgrade head
```

Baza `database.db` nije u repozitorijumu, pa posle prve migracije kreće prazna.
Oznake za apartmane (Wi-Fi, parking, klima…) se upisuju same pri pokretanju
aplikacije, a korisnici se prave kroz registraciju u samoj aplikaciji.

**5. Pokretanje**

```bash
uvicorn app.main:app --reload
```

Backend sluša na `http://127.0.0.1:8000`.

---

## Pokretanje frontenda

Sve komande se izvršavaju iz foldera `frontend`.

```bash
cd frontend
npm install
npm run dev
```

Frontend sluša na `http://localhost:3000`. Port je zakucan u `vite.config.ts`,
pa ako je zauzet, pokretanje neće uspeti umesto da tiho pređe na drugi port.

Adresa backenda se čita iz `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Za produkcionu verziju:

```bash
npm run build      # gradi u frontend/dist
npm run preview    # pregled izgrađene verzije
```

**Backend mora da radi pre frontenda**, jer frontend sve podatke povlači sa
njega. Redosled je: prvo `uvicorn`, pa `npm run dev`.

---

## Adrese

| | |
|---|---|
| Aplikacija | http://localhost:3000 |
| API | http://127.0.0.1:8000 |
| Swagger UI | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |
| OpenAPI dokument | http://127.0.0.1:8000/openapi.json |

## Migracije

Šema baze se vodi isključivo kroz Alembic, iz foldera `backend`:

```bash
alembic upgrade head                          # primeni sve migracije
alembic revision --autogenerate -m "opis"     # napravi novu iz izmena u modelima
alembic current                               # trenutna verzija baze
alembic history                               # spisak migracija
alembic downgrade -1                          # korak unazad
```

## OpenAPI specifikacija

Izvezena specifikacija stoji u `backend/openapi.json`. Posle izmene ruta se
regeneriše iz foldera `backend`:

```bash
python scripts/export_openapi.py
```

## Uloge

| Uloga | Šta može |
|---|---|
| `USER` | pretraga, rezervacija, ocenjivanje boravka |
| `HOST` | sve prethodno, plus sopstveni apartmani, odgovor na rezervacije i statistika zarade |
| `ADMIN` | upravljanje oznakama i brisanje neprimerenih ocena |

Uloga se bira pri registraciji; `ADMIN` se ne može dodeliti sam sebi, upisuje se
direktno u bazu.

## Struktura projekta

```
backend/
  app/
    features/     apartments, apartment_photos, auth, reservations, reviews, stats, tags
                  svaka funkcionalnost ima router.py, schemas.py i service.py
    shared/       baza, greške, paginacija, Swagger, outbox, spoljni servisi
    models/       SQLModel tabele
    enums/
  alembic/        migracije
  scripts/        izvoz OpenAPI specifikacije
  static/         otpremljene slike apartmana

frontend/
  src/
    app/          rutiranje i zajednički izgled stranice
    features/     apartments, auth, host, reservations, reviews, tags
    shared/       API klijent, deljene komponente i kuke
    i18n/         prevodi za srpski i engleski
```

## Napomene

- Slike apartmana se čuvaju na disku u `backend/static/images/apartments` i
  služe se sa `/static`, dok su u bazi samo putanje.
- Mejlovi se ne šalju unutar zahteva, nego ih u pozadini isporučuje outbox
  radnik, sa ponovnim pokušajima ako slanje ne uspe.
- Brisanje apartmana je meko: red ostaje u bazi da bi stare rezervacije i dalje
  pokazivale na postojeći apartman.
- Pre postavljanja na produkciju prebaciti `COOKIE_SECURE` na `true` i
  postaviti svoj `JWT_SECRET` i `REFRESH_HASH_PEPPER` umesto podrazumevanih.
