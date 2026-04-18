FROM node:alpine AS builder
COPY ./package*.json /srv
COPY ./apps/docs/package*.json /srv/apps/docs/
COPY ./packages/eposlabs-tsconfig /srv/packages/eposlabs-tsconfig/
RUN cd /srv && npm ci -w docs --include-workspace-root
COPY ./apps/docs/ /srv/apps/docs/
RUN cd /srv && npm run build -w docs

FROM caddy:alpine
COPY ./apps/docs/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /srv/apps/docs/dist/ /srv/
