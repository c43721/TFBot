# Builder
FROM node:16 AS build
WORKDIR /opt/app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV CI=true

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY .yarn/plugins .yarn/plugins

RUN yarn install --immutable

COPY ./scripts .
COPY tsconfig.json .
COPY tsup.config.ts .
COPY ./src ./src

RUN yarn build

# Runner
FROM node:16
WORKDIR /opt/app

ARG VERSION
ARG BUILT_AT

# Yarn v3
ENV CI=true
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV VERSION=${VERSION}
ENV BUILT_AT=${BUILT_AT}

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY .yarn/plugins .yarn/plugins
COPY prisma prisma

RUN yarn workspaces focus --all --production

RUN npx prisma generate

COPY ./assets ./assets
COPY ./src/languages ./dist/languages
COPY ./scripts ./scripts
COPY --from=build /opt/app/dist ./dist
COPY changelog.md ./dist

USER node
CMD ["node", "--enable-source-maps", "."]

EXPOSE 8080