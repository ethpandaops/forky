FROM debian:latest
COPY forkchoice* /forkchoice
ENTRYPOINT ["/forkchoice"]
