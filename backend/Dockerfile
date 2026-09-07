FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Baza i otpremljene slike zive na volumenima, da prezive gasenje kontejnera.
RUN mkdir -p /data /app/static/images/apartments

EXPOSE 8000

# Migracije idu pre servera, da kontejner nikad ne pocne da radi nad starom semom.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
