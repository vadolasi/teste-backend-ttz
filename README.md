# Teste técnico backend TTZ

## Tecnologias utilizadas

Para realizar esse teste, utilizei a linguagem Typescript junto com o framework [NestJS](https://nestjs.com). Os padrões de organização e nomeação de arquivos seguiu o padrão do framework, e do que é mais amplamente utilizado pela comunidade.

Para armazenamento de dados, utilizei Postgres junto com o [TimescaleDB](https://github.com/timescale/timescaledb). O TimescaleDB é uma extensão para o Postgres que adiciona algumas otmizações e operações ao trabalhar séries temporais, que são dados coletados ao longo do tempo, o que é o caso do log de eventos. Também utilizei o Redis como cache e como fila.

## Como executar

Utilizo o Docker para subir os servidores de banco de dados durante o desenvolvimento, Para facilitar o trabalho de vocês, criei um Dockerfile para o backend. Para execitar o projeto completo, basta ter o Docker e Docker Compose, e executar o coando abaixo:

```bash
docker compose -f compose.yaml -f compose.test.yaml up
```

## Documentação

A documentação via Swagger está dispoível em `/docs`
