FROM ghcr.io/cirruslabs/flutter:stable AS builder

WORKDIR /app
COPY mobile ./mobile

WORKDIR /app/mobile
RUN flutter pub get
RUN flutter create --platforms=web .

ARG API_BASE_URL=https://backend-production-c2da.up.railway.app/api/v1
RUN flutter build web --release --dart-define=API_BASE_URL=${API_BASE_URL}

FROM nginx:alpine AS runner
COPY mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY mobile/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=builder /app/mobile/build/web /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
