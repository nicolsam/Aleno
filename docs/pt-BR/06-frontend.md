# Frontend

## Páginas

As páginas principais ficam em `src/app`:

- `/`: página de entrada.
- `/login`: página de autenticação.
- `/dashboard`: dashboard de leitura.
- `/dashboard/students`: gestão de alunos.
- `/dashboard/students/[id]`: detalhe e histórico do aluno.
- `/dashboard/classes`: gestão de turmas.
- `/dashboard/schools`: gestão de escolas.
- `/dashboard/admin`: visão geral admin.
- `/dashboard/admin/logs`: visualização de logs de auditoria.
- `/dashboard/admin/sessions`: visualização de sessões.

## Layout Do Dashboard

`src/app/dashboard/layout.tsx` controla:

- guarda de autenticação usando token e dados do professor em `localStorage`,
- navegação lateral,
- seletor de idioma,
- logout,
- chamadas de heartbeat,
- seletor de escola,
- persistência de `selectedSchool`,
- disparo do evento de navegador `schoolChanged`.

## Busca De Dados No Cliente

As páginas do dashboard são client components. Elas buscam dados da API usando o bearer token de `localStorage`.

Ao adicionar ou alterar dados do dashboard:

- mantenha estados de carregamento explícitos,
- use skeleton components existentes quando possível,
- trate estado não autorizado retornando para `/login`,
- atualize cobertura Vitest ou Playwright para mudanças de comportamento.

## Componentes

- `src/components/ui`: primitivas reutilizáveis de UI.
- `src/components/skeletons`: placeholders de carregamento para dashboard, escolas e alunos.
- `src/components/LanguageSwitcher.tsx`: controle de troca de idioma.

## Estilos

O projeto usa Tailwind CSS e classes em componentes locais. Prefira padrões visuais existentes em vez de introduzir um novo design system.

## Alias De Importação

Use `@/*` para imports dentro de `src`:

```ts
import { prisma } from '@/lib/db'
```
