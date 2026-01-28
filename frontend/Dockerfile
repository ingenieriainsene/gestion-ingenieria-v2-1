FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Usamos Nginx para servir la app de Angular
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Copia una configuración básica de nginx si necesitas rutas (opcional)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]