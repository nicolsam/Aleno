# Banco De Dados

## Provedor

A aplicação usa PostgreSQL por meio do Prisma e `@prisma/adapter-pg`.

O PostgreSQL local é definido em `docker-compose.yml`:

- imagem: `postgres:15`
- banco: `aleno`
- usuário: `postgres`
- senha: `postgres`
- porta: `5432`

## Arquivos Do Prisma

- `prisma/schema.prisma`: fonte da verdade para models e relações.
- `prisma/migrations`: migrations versionadas.
- `prisma/seed.ts`: seed dos níveis de leitura.
- `prisma.config.ts`: configuração do Prisma usando `DIRECT_URL` ou `DATABASE_URL`.

## Modelo De Domínio

- `School`: unidade organizacional. Escolas podem ter professores, alunos e turmas.
- `Class`: ano, seção e turno dentro de uma escola. A combinação de escola, ano, seção e turno é única.
- `Teacher`: conta de usuário com email, hash de senha, flag opcional de admin global, sessões, logs de auditoria e vínculos com escolas.
- `TeacherSchool`: tabela de junção que concede acesso de um professor a uma escola.
- `Student`: perfil de aluno vinculado a uma escola e turma. Números de aluno são únicos dentro de uma escola.
- `ReadingLevel`: dados de referência ordenados para níveis de leitura.
- `StudentReadingHistory`: avaliações de leitura registradas por um professor para um aluno.
- `UserSession`: metadados de sessão baseados em token.
- `AuditLog`: eventos de atividade administrativa e de usuário.

## Soft Delete

Escolas, turmas e alunos usam `deletedAt` para exclusão lógica. Consultas normais filtram esses registros. Rotas de restauração definem `deletedAt` como `null`.

## Dados De Seed

`prisma/seed.ts` faz upsert destes níveis de leitura:

- `DNI`: Does Not Identify
- `LO`: Letters Only
- `SO`: Syllables Only
- `RW`: Reads Words
- `RS`: Reads Sentences
- `RTS`: Reads Text Syllabically
- `RTF`: Reads Text Fluently

Execute o seed com:

```bash
pnpm prisma db seed
```

## Notas De Desenvolvimento

- Revise migrations antes de comitá-las.
- Mantenha nomes de models e nomes de respostas da API alinhados com o código existente.
- Ao adicionar campos obrigatórios, atualize seed, testes, formulários e validação de API juntos.
