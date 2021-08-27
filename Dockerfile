FROM node:16-slim AS build
WORKDIR /opt/app

COPY tsconfig.json .
COPY package.json .
COPY yarn.lock .
COPY ./src ./src

RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:16-buster-slim
WORKDIR /opt/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package.json .
COPY yarn.lock .

RUN yarn install --prod --frozen-lockfile && yarn cache clean

COPY --from=build /opt/app/dist ./dist
COPY ./languages ./languages
COPY ./migrations ./migrations
COPY ./assets ./assets
COPY changelog.md /opt/app/dist

USER node
CMD ["node", "."]

EXPOSE 3000