# Build Stage
FROM golang:1.26.4-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy dependencies list and download
COPY go.mod ./
# If go.sum exists, copy it as well
COPY go.sum* ./
RUN go mod download

# Copy source code and build the application
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# Final Stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for Firebase secure API communication
RUN apk add --no-cache ca-certificates

# Copy the pre-built binary
COPY --from=builder /app/main .

# Expose port 3000 as configured for the app
EXPOSE 3000

# Set environment variables
ENV GIN_MODE=release

# Start the Go server
CMD ["./main"]
