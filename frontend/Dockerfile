FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# --webpack: en Docker sobre Windows hace falta sondeo de archivos (WATCHPACK_POLLING),
# que Turbopack (el empaquetador por defecto) no usa.
CMD ["npm", "run", "dev", "--", "--webpack", "--hostname", "0.0.0.0", "--port", "3000"]
