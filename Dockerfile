FROM golang:1.24
WORKDIR /app
COPY . .
RUN go mod download
WORKDIR /app/backend
RUN go build -ldflags="-s -w" -o pastebin
RUN pwd
CMD ["/app/pastebin"]