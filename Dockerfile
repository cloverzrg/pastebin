FROM golang:1.24
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN go mod download
RUN go build -ldflags="-s -w" -o pastebin
CMD ["/app/backend/pastebin"]