FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
RUN sed -i 's/const USE_MOCK = true/const USE_MOCK = false/' /usr/share/nginx/html/index.html && \
    sed -i "s|const API_BASE = '';|const API_BASE = '/api';|" /usr/share/nginx/html/index.html
EXPOSE 80
