FROM golang:1.24
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN go mod download
RUN go build -ldflags="-s -w" -o pastebin
ENV ADMIN_USERNAME=admin
ENV ADMIN_PASSWORD=admin
EXPOSE 8080
CMD ["./pastebin"]