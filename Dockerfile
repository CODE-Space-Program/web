FROM oven/bun:latest

WORKDIR /app

COPY . .

WORKDIR /app

RUN bun install --frozen-lockfile

EXPOSE 3000

CMD [ "bun", "start" ]
