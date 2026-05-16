# Build Frontend
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# We set API URL to empty since the same server will host the backend under /api
ENV VITE_API_URL=""
RUN npm run build

# Setup Backend
FROM node:20-alpine AS production-stage
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy frontend build to the expected location
COPY --from=build-stage /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
