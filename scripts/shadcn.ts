// Usage:
// > npm run shadcn [workspace] [...components]
// ============================================================================

import { run } from '@eposlabs/utils/node'

void (() => {
  const args = process.argv.slice(2)
  const [workspace, ...components] = args
  run(`npx -w ${workspace} shadcn add ${components.join(' ')}`)
  run(`npx -w ${workspace} prettier --write src`)
})()
