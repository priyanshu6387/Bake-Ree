FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--turbopack", "-H", "0.0.0.0", "-p", "3000"]
