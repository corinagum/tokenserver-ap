FROM node:12
RUN apt-get update && \
  apt-get upgrade && \
  apt-get add --no-cache bash git openssh
ADD . /bot
WORKDIR /bot
RUN npm install npm@latest -g && \
  npm install
ENV PORT=80
EXPOSE 80
ENTRYPOINT node .