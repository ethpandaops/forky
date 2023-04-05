FROM debian:latest
COPY forky* /forky
ENTRYPOINT ["/forky"]
