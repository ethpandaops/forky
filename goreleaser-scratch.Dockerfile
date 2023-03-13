FROM gcr.io/distroless/static-debian11:latest
COPY forkchoice* /forkchoice
ENTRYPOINT ["/forkchoice"]
