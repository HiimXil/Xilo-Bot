FROM node:current-alpine3.21
WORKDIR /usr/src/app
ENV DATABASE_URL="file:./dev.db"
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm run prisma:deploy
RUN npm run prisma:migrate

# Add timezone configuration
RUN apk add --no-cache tzdata
ENV TZ=Europe/Paris
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN chown -R node:node /usr/src/app
USER node
ENTRYPOINT ["node", "dist/index.js"]