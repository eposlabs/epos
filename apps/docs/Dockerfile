FROM node:alpine AS builder
WORKDIR /srv
COPY ./package*.json ./
COPY ./apps/docs/package*.json ./apps/docs/
COPY ./packages/eposlabs-tsconfig ./packages/eposlabs-tsconfig/
RUN npm ci -w docs --include-workspace-root
COPY ./apps/docs/ ./apps/docs/
RUN npm run build -w docs

FROM caddy:alpine
COPY ./apps/docs/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /srv/apps/docs/dist/ /srv/
