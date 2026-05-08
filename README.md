## MusicLynx server

This is the server component of MusicLynx (https://github.com/darkjazz/musiclynx)

## Running locally

Requires Node.js and a local PostgreSQL instance with the `musiclynx` database.

Create a `.env` file in this directory (already present locally):
```
USE_POSTGRES=true
DATABASE_URL=postgresql:///musiclynx
```

Start the server:
```
node musiclynx-server.js
```

The server listens on port 8080 by default (`http://localhost:8080`).

To use a different port or add API keys, set environment variables before starting:
```
PORT=8080 YOUTUBE_API_KEY=... node musiclynx-server.js
```

Alternatively, copy `init.sh.in` to `init.sh`, fill in your API keys, and run it:
```
./init.sh
```

## License

GNU General Public License v3.0, see [LICENSE.md](https://github.com/darkjazz/musiclynx-server/blob/heroku/LICENSE.md)
