## Setup

```bash
bun install -g private-blog-template@latest
pblog
```

Replace `clientId` and `clientSecret` in `auth.config.ts` with values from your Google Account

[Setup Google OAuth 2.0](https://console.developers.google.com/apis/credentials)

### Authorized JavaScript origins

- http://localhost:4321

### Authorized redirect URIs

- http://localhost:4321/api/auth/callback/google

### Suggestions

- [Awesome.md](awesome.md)
