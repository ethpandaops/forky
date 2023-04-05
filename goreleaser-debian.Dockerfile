FROM debian:latest
COPY forky* /forky
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates
ENTRYPOINT ["/forky"]
