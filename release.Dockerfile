FROM scratch
COPY metrics-server /
ENTRYPOINT [ "/metrics-server" ]
