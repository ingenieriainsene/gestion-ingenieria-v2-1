# ETAPA 1: Construcción
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# CORRECCIÓN 1: Usamos 'npx' y la sintaxis explícita con '=' para que no se confunda
RUN npx ng build --configuration=production

# ETAPA 2: Servidor Web
FROM nginx:alpine

# CORRECCIÓN 2: Usamos el nombre real de tu proyecto (gestion-frontend) que vimos en los logs
# NOTA: En Angular 17+ la ruta incluye '/browser'. Si falla, borra '/browser' de la ruta.
COPY --from=build /app/dist/gestion-frontend/browser /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]