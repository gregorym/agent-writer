# Project coding standards

## General guidelines

- Do not use console.log
- Do not add comments unless explicitly asked

# TRPC React guidelines

- Never use query and mutation callbacks (onSuccess , onError)
- Handle success and error states inside a handle where the mutation is called from
