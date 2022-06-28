build:
	go build -o bin/main cmd/main.go

run:
	go run main.go

test:
	go test -v
lint:

clean:
	-rm -rf ${CURRENT_DIR}/bin

.PHONY: lint
lint: $(GOPATH)/bin/golangci-lint
	go mod tidy
	golangci-lint run --fix --verbose --concurrency 4 --timeout 5m