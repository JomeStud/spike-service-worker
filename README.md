# SubGuard Test

A minimal offline-capable PWA spike for service worker caching, local notifications, and mobile install testing.

## Dev setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate a local TLS certificate (once)

Install [mkcert](https://github.com/FiloSottile/mkcert), then:

```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1 $(ipconfig getifaddr en0)
```

This creates `localhost+2.pem` and `localhost+2-key.pem` in the project root (gitignored).

### 3. Build and serve

```bash
npm run build
npx http-server dist -S -C localhost+2.pem -K localhost+2-key.pem -p 8443
```

Open `https://localhost:8443` in a desktop browser, or `https://<your-local-ip>:8443` from a phone on the same Wi-Fi.

### 4. Trust the certificate on iOS (once)

1. AirDrop `"$(mkcert -CAROOT)/rootCA.pem"` to the iPhone.
2. Open it — install the profile via Settings → General → VPN & Device Management.
3. Go to Settings → General → About → Certificate Trust Settings and enable full trust for the mkcert CA.

### 5. Trust the certificate on Android (once)

1. Copy `"$(mkcert -CAROOT)/rootCA.pem"` to the device (cable, AirDrop, or Google Drive).
2. Go to Settings → Security → More security settings → Encryption & credentials → Install a certificate → CA certificate.
3. Select the file and confirm. Chrome will now trust the mkcert CA.
