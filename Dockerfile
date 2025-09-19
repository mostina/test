# --- Base image ---
FROM python:3.12-slim

# --- Dipendenze di sistema utili per compilazioni e Poetry ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential gcc \
 && rm -rf /var/lib/apt/lists/*

# --- Installa Poetry ---
RUN curl -sSL https://install.python-poetry.org | python3 - \
 && ln -s /root/.local/bin/poetry /usr/local/bin/poetry

ENV PATH="/root/.local/bin:$PATH"

# --- Imposta la cartella di lavoro ---
WORKDIR /code

# --- Copia solo i file di gestione delle dipendenze per sfruttare la cache ---
COPY pyproject.toml poetry.lock* /code/

# --- Evitiamo la virtualenv di Poetry dentro il container (installiamo nel sistema) ---
RUN poetry config virtualenvs.create false \
 && poetry install --no-interaction --no-ansi --no-root


# --- Copia il resto del progetto ---
COPY . /code

# --- Comando per avviare FastAPI ---
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

