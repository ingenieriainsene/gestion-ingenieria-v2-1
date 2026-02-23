# ETAPA 1: Construcción
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Compilamos para producción
RUN npx ng build --configuration=production

# ETAPA 2: Servidor Web
FROM nginx:alpine

# Copiamos la nueva configuración de Nginx que acabamos de crear
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados a Nginx
COPY --from=build /app/dist/gestion-frontend /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]