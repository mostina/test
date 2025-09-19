# Usa Node come base
FROM node:20-alpine

WORKDIR /app

# Copia solo i file di dipendenze per sfruttare la cache
COPY package.json package-lock.json /app/

# Installa le dipendenze
RUN npm install

# Copia il resto del progetto
COPY . /app

# Espone la porta dove Vite serve il frontend
EXPOSE 5174:5173

# Comando per avviare il dev server
CMD ["npm", "run", "dev", "--", "--host"]
