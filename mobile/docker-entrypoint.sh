#!/bin/sh
set -e
PORT="${PORT:-80}"
API_PROXY_TARGET="${API_PROXY_TARGET:-https://backend-production-c2da.up.railway.app}"

sed "s/listen 80;/listen ${PORT};/" /etc/nginx/conf.d/default.conf.template \
  | sed "s|__API_PROXY_TARGET__|${API_PROXY_TARGET}|g" \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
