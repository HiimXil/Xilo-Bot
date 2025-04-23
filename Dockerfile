FROM node:lts-alpine3.17

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV DATABASE_URL="file:./dev.db"

EXPOSE 3000

CMD ["node", "dist/index.js"]