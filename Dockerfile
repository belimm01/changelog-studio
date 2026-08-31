FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm install

COPY . .
RUN npm run build -w @changelog-studio/web
RUN npm run build -w @changelog-studio/api

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_PATH=/data/changelog.sqlite
ENV STATIC_DIR=/app/public

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
RUN npm install --omit=dev -w @changelog-studio/api && npm cache clean --force

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./public

VOLUME ["/data"]
EXPOSE 8080
CMD ["node", "apps/api/dist/index.js"]
