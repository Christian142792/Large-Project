FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend
COPY . .
RUN npm run build --prefix frontend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
