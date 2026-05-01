# Docker Dev Setup

This setup runs `client` (Next.js), `server` (Express + Nodemon), and `mongo` with live code reload.

## 1) First run (one time)

```bash
docker compose up -d --build
```

After this, keep containers running. Any code changes in `client/` or `server/` reflect automatically on localhost.

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## 2) Daily workflow

- Edit code normally.
- Hot reload / auto-restart works via bind mounts + polling watchers.
- No need to run `docker compose up` repeatedly.

## 3) Useful commands

```bash
# Start existing containers (no rebuild)
docker compose start

# View logs
docker compose logs -f client
docker compose logs -f server

# Restart app containers if watcher gets stuck
docker compose restart client server

# Stop containers (preserves volumes/data)
docker compose stop

# Stop and remove containers/network
docker compose down

# Stop and remove DB data volume (dangerous: deletes local mongo data)
docker compose down -v
```

## 4) When rebuild is required

- If you change `client/package.json` or `server/package.json`, run:

```bash
docker compose up -d --build
```
