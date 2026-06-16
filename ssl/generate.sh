#!/bin/bash
set -e

SSL_DIR="$(dirname "$0")"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "SSL certificates already exist. Remove them to regenerate."
    exit 0
fi

echo "Generating self-signed SSL certificate for development..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=TaskTracker/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "SSL certificate generated:"
echo "  Certificate: $CERT_FILE"
echo "  Private key: $KEY_FILE"
