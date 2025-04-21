# Étape 1 : build
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# Étape 2 : exécution
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./
COPY --from=builder /app/prisma ./prisma

RUN npm install --omit=dev

CMD ["node", "dist/index.js"]
