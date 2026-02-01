// Usage:
// > npm run release -- [patch|minor|major] [workspace1] [workspace2] ...
// ============================================================================

import { run } from './utils/run.ts'

void (() => {
  const { version, targets } = parseArgs()
  const workspacesArg = targets.map(target => `-w ${target}`).join(' ')
  if (version) run(`npm version ${version} --workspaces-update=false ${workspacesArg}`)
  run(`syncpack fix-mismatches`)
  run(`npm run build ${workspacesArg}`)
  run(`npm publish ${workspacesArg}`)
  run(`npm install`)
})()

function parseArgs() {
  const args = process.argv.slice(2)
  if (args[0] === 'patch' || args[0] === 'minor' || args[0] === 'major') {
    return { version: args[0], targets: args.slice(1) }
  } else {
    return { version: null, targets: args }
  }
}
