CURRENT_DIR=$(shell pwd)
DIST_DIR=${CURRENT_DIR}/dist
UI_DIR=${CURRENT_DIR}/extensions/resource-metrics/resource-metrics-extention/ui
UI_DIST_DIR=${UI_DIR}/dist
BINARY_NAME:=argocd-metrics-server
DOCKERFILE:=Dockerfile

BUILD_DATE=$(shell date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(shell git rev-parse HEAD)
GIT_BRANCH=$(shell git rev-parse --symbolic-full-name --verify --quiet --abbrev-ref HEAD)
GIT_TAG=$(shell if [ -z "`git status --porcelain`" ]; then git describe --exact-match --tags HEAD 2>/dev/null; fi)
GIT_TREE_STATE=$(shell if [ -z "`git status --porcelain`" ]; then echo "clean" ; else echo "dirty"; fi)

DOCKER_PUSH?=false
IMAGE_NAMESPACE?=quay.io/argoprojlabs
VERSION?=latest
BASE_VERSION:=latest

override LDFLAGS += \
  -X ${PACKAGE}.version=${VERSION} \
  -X ${PACKAGE}.buildDate=${BUILD_DATE} \
  -X ${PACKAGE}.gitCommit=${GIT_COMMIT} \
  -X ${PACKAGE}.gitTreeState=${GIT_TREE_STATE}

ifeq (${DOCKER_PUSH},true)
    PUSH_OPTION="--push"
    ifndef IMAGE_NAMESPACE
        $(error IMAGE_NAMESPACE must be set to push images (e.g. IMAGE_NAMESPACE=quay.io/numaproj))
    endif
endif

ifneq (${GIT_TAG},)
VERSION=$(GIT_TAG)
override LDFLAGS += -X ${PACKAGE}.gitTag=${GIT_TAG}
endif

build:
	go build -v -ldflags '${LDFLAGS}' -o ${DIST_DIR}/$(BINARY_NAME) ./cmd

.PHONY: test-coverage
test-coverage:
	go test -covermode=atomic -coverprofile=test/profile.cov.tmp $(shell go list ./... | grep -v /vendor/ | grep -v /numaflow/test/ | grep -v /pkg/client/ | grep -v /pkg/proto/ | grep -v /hack/)
	cat test/profile.cov.tmp | grep -v v1alpha1/zz_generated | grep -v v1alpha1/generated > test/profile.cov
	rm test/profile.cov.tmp
	go tool cover -func=test/profile.cov

.PHONY: clean
clean:
	-rm -rf ${DIST_DIR}

.PHONY: clean-ui
clean-ui:
	-rm -rf ${UI_DIST_DIR}
	find ${UI_DIR} -type f -name extension.tar -delete

.PHONY: test
test:
	go test -v ./...

.PHONY: image
image:
	DOCKER_BUILDKIT=1 docker build  -t $(IMAGE_NAMESPACE)/$(BINARY_NAME):$(VERSION)  -f $(DOCKERFILE) .
	@if [ "$(DOCKER_PUSH)" = "true" ]; then docker push $(IMAGE_NAMESPACE)/$(BINARY_NAME):$(VERSION); fi

.PHONY: build-ui
build-ui: clean-ui
	yarn --cwd ${UI_DIR} install
	yarn --cwd ${UI_DIR} build
