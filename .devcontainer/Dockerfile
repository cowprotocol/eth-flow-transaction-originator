FROM --platform=linux/amd64 mcr.microsoft.com/vscode/devcontainers/base:0

ENV DENO_INSTALL=/deno

RUN mkdir -p /deno \
    && wget https://deno.land/install.sh \
    && sh install.sh \
    && chown -R vscode /deno

ENV PATH=${DENO_INSTALL}/bin:${PATH} \
    DENO_DIR=${DENO_INSTALL}/.cache/deno
