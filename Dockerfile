FROM node:8.9 as builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

# Install dependencies
COPY package.json yarn.lock /usr/src/app/
RUN yarn install && yarn cache clean



FROM node:8.9-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY . /usr/src/app
