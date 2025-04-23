FROM node:current-alpine3.21

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm run prisma:deploy

ENV DATABASE_URL="file:./dev.db"

ENTRYPOINT ["node", "dist/index.js"]