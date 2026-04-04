// Usage:
// > npm run shadcn [component1] [component2] ... -w [workspace]
// ============================================================================

import { run } from './utils/run.ts'

void (() => {
  const args = process.argv.slice(2)
  run(`shadcn add ${args.join(' ')}`)
  run(`prettier --write src`)
})()
