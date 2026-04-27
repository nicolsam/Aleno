# Autenticação E Sessões

## Login E Cadastro

`POST /api/auth` aceita um campo `action`:

- `register`: cria um professor, gera hash da senha com bcrypt, cria uma sessão, escreve log de auditoria e retorna token mais payload do professor.
- `login`: verifica credenciais, cria uma sessão, escreve log de auditoria e retorna token mais payload do professor.

O payload retornado do professor inclui:

- `id`
- `name`
- `email`
- `isGlobalAdmin`

## Tokens

Tokens são JWTs assinados com `JWT_SECRET` e expiram depois de 7 dias. Requisições protegidas usam:

```text
Authorization: Bearer <token>
```

`src/lib/auth.ts` contém hash de senha, verificação de senha, geração de token e verificação de token.

## Armazenamento No Frontend

O dashboard armazena:

- `token`: bearer token usado nas requisições de API.
- `teacher`: payload do professor logado.
- `selectedSchool`: filtro atual de escola no dashboard.

Esses valores ficam em `localStorage`.

## Heartbeat

`src/app/dashboard/layout.tsx` envia heartbeat para `POST /api/auth/heartbeat` imediatamente depois de montar e depois a cada 2 minutos. O heartbeat atualiza dados de atividade da sessão.

## Acesso Admin

Rotas de API admin chamam `verifyAdmin` de `src/lib/admin.ts`. Uma requisição é permitida apenas quando:

- existe um bearer token,
- o token é válido,
- o professor correspondente existe,
- `teacher.isGlobalAdmin` é true.

## Logs De Auditoria

`src/lib/audit.ts` grava linhas de auditoria. Ações de autenticação registram `REGISTER` e `LOGIN`. Ao adicionar ações sensíveis ou administrativas, adicione auditoria na borda da rota.
