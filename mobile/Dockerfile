FROM ghcr.io/cirruslabs/flutter:stable AS builder

WORKDIR /app
COPY mobile ./mobile

WORKDIR /app/mobile
RUN flutter --version
RUN flutter pub get
RUN flutter config --enable-web

# Same-origin API — nginx proxies /api to the backend (see nginx.conf.template)
ARG API_BASE_URL=/api/v1
RUN flutter build web --release --dart-define=API_BASE_URL=${API_BASE_URL}

FROM nginx:alpine AS runner
COPY mobile/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY mobile/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=builder /app/mobile/build/web /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
