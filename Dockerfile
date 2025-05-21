FROM node:current-alpine3.21

WORKDIR /usr/src/app
ENV DATABASE_URL="file:./dev.db"

RUN apk add --no-cache fontconfig ttf-dejavu

RUN apk add --no-cache \
    python3 make g++ pkgconfig \
    cairo-dev pango-dev libpng-dev jpeg-dev giflib-dev pixman-dev

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Add timezone configuration
RUN apk add --no-cache tzdata
ENV TZ=Europe/Paris
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copier le script de démarrage et donner les permissions
COPY start.sh .
RUN chmod +x start.sh

RUN chown -R node:node /usr/src/app
USER node

ENTRYPOINT ["./start.sh"]
