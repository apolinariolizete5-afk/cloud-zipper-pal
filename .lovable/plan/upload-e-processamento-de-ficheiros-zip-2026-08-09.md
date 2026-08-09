# Upload e processamento de ficheiros ZIP

## Objetivo
Permitir que o utilizador faça upload de um ficheiro ZIP (contendo documentos e/ou ficheiros de dados), extraia o seu conteúdo e guarde tudo de forma persistente no Lovable Cloud, com pré-visualização dos ficheiros extraídos.

## Como funciona (fluxo do utilizador)
1. O utilizador abre a app (`/`) e arrasta/seleciona um ficheiro `.zip`.
2. A app envia o ZIP para uma função de servidor que o extrai.
3. Os ficheiros extraídos são guardados no Storage do Lovable Cloud e os seus metadados + texto extraído ficam numa tabela da base de dados.
4. O utilizador vê a lista de ficheiros extraídos com pré-visualização do conteúdo (texto, CSV, JSON, imagens).

## Decisões técnicas
- **Runtime do servidor:** Cloudflare Worker — apenas bibliotecas JavaScript puras, sem binários nativos.
- **Descompressão ZIP:** `fflate` (pure-JS, compatível com Workers) — descomprime ZIP no servidor. Ficheiros grandes são tratados em memória com limite de tamanho.
- **Parsing de conteúdo:** extração de texto para ficheiros de texto/CSV/JSON/Markdown. Ficheiros binários (PDF, Office) ficam guardados no Storage para download; o texto destes será processado numa fase opcional (ver "Futuro").
- **Persistência:** Lovable Cloud — Storage para os ficheiros extraídos + base de dados para metadados.
- **Auth:** como não foi pedido login, os uploads ficam públicos (qualquer visitante pode carregar). Se mais tarde quiser proteger, movemos para `_authenticated/`.

## Passos de implementação

### 1. Ativar Lovable Cloud
- Ligar o Cloud (database + storage + auth disponíveis).

### 2. Esquema da base de dados (migração)
- Tabela `public.uploads`:
  - `id uuid pk`, `filename text`, `size_bytes bigint`, `file_count int`, `created_at timestamptz`
- Tabela `public.upload_files`:
  - `id uuid pk`, `upload_id uuid fk → uploads(id) on delete cascade`, `path text`, `filename text`, `mime_type text`, `size_bytes bigint`, `storage_path text`, `preview_text text`, `created_at timestamptz`
- `GRANT`s apropriados (anon + authenticated) + RLS com políticas simples (leitura pública, escrita pública neste MVP).
- Sem demon rows (a app começa vazia).

### 3. Storage
- Criar bucket `uploads` (público) para guardar os ficheiros extraídos.
- Os ficheiros do ZIP ficam em `uploads/<upload_id>/<caminho-no-zip>`.

### 4. Dependências
- Instalar `fflate` (descompressão ZIP no servidor).

### 5. Funções de servidor (`src/lib/zip.functions.ts`)
- `createUpload` (POST): recebe `FormData` com o `.zip`:
  - Lê os bytes do ZIP.
  - Descomprime com `fflate.unzipSync` no servidor.
  - Para cada ficheiro extraído:
    - Determina `mime_type` e `preview_text` (texto para txt/csv/json/md; binário guarda só metadados).
    - Faz upload do ficheiro para o bucket `uploads` via `supabaseAdmin`.
  - Insere a row em `uploads` e as rows em `upload_files`.
  - Devolve `{ uploadId, files: [...] }`.
- `listUploads` (GET): lista os uploads + ficheiros (para a galeria).
- `getUpload` (GET): detalhe de um upload.

### 6. UI — substituir `src/routes/index.tsx`
- Página única com:
  - Zona de drop/select de `.zip` (input file `accept=".zip"`).
  - Barra de progresso durante o upload/processamento.
  - Lista de uploads anteriores (cada um expandível para mostrar os ficheiros extraídos).
  - Pré-visualização inline de cada ficheiro (texto/CSV/JSON/Markdown em `<pre>`; imagem em `<img>`; outros como link de download).
- Cabeçalho H1 + meta tags SEO próprias (título, descrição, og).

### 7. Verificação
- Confirmar build sem erros.
- Abrir a preview, carregar um ZIP de teste e confirmar que os ficheiros aparecem extraídos e persistidos.

## Futuro (não incluído agora)
- Processamento com IA (resumir/classificar ficheiros extraídos) — será uma opção por ficheiro quando decidir.
- Extração de texto de PDF/Office (biblioteca compatível com Worker).
- Proteção por login (mover para `_authenticated/`).

## Risco / limite
- ZIPs muito grandes podem exceder a memória do Worker; o plano impõe um limite de tamanho (ex.: 20 MB) e número de ficheiros.
