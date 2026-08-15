FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- local development target (docker-compose builds this) ---
FROM deps AS dev
COPY . .
EXPOSE 3000
# npm install (not just the image's baked-in npm ci) runs on every container
# start, not only on image build — the named node_modules volume in
# docker-compose.yml persists across restarts and doesn't get refreshed
# from a rebuilt image on its own, so this self-heals when package.json
# changes on the host without needing to manually drop the volume.
CMD ["sh", "-c", "npm install && npm run start:dev"]

# --- build stage, compiles for production ---
FROM deps AS build
COPY . .
RUN npm run build

# --- production target (default, used by CI/CD for the ECR image) ---
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
