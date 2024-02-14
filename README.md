## Setup

```bash
bunx private-blog-template
```

Replace `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` with values from your Google Account

[Setup Google OAuth 2.0](https://console.developers.google.com/apis/credentials)

Update users list in `src/users.json`

### Authorized JavaScript origins

- http://localhost:4321

### Authorized redirect URIs

- http://localhost:4321/api/auth/callback/google

### Suggestions

- [Awesome.md](awesome.md)
