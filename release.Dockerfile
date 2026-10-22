FROM scratch
ARG TARGETPLATFORM
COPY $TARGETPLATFORM/metrics-server /
ENTRYPOINT [ "/metrics-server" ]
