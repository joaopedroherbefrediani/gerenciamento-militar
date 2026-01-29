/**
 * Vercel workaround:
 * - Remove qualquer resíduo de build (.next) para evitar referências quebradas
 * - Garante que o grupo de rota app/(protected) não exista (ele não é usado)
 *
 * Isso evita erros do tipo:
 * ENOENT: no such file or directory, lstat '.next/server/app/(protected)/page_client-reference-manifest.js'
 */

const fs = require('fs')
const path = require('path')

async function rmSafe(p) {
  try {
    await fs.promises.rm(p, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

async function main() {
  const root = process.cwd()
  await rmSafe(path.join(root, '.next'))
  await rmSafe(path.join(root, 'app', '(protected)'))
}

main().catch(() => process.exit(0))

