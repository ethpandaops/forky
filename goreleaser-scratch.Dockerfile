FROM gcr.io/distroless/static-debian11:latest
COPY forky* /forky
ENTRYPOINT ["/forky"]
