## Como executar

Suba o ambiente:

```bash
docker compose up
```

Acesse:

- `http://localhost:8080`

## Comportamento esperado

Sempre que acessar o Nginx, a aplicação Node.js:

- insere um registro na tabela `people` no MySQL (ex.: `Alexandre-251051`)
- retorna uma página HTML contendo:
  - `<h1>Full Cycle Rocks!</h1>`
  - a lista de nomes já cadastrados no banco
