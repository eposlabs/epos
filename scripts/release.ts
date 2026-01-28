// Usage:
// > npm run release -- [patch|minor|major|none=patch] [workspace1] [workspace2] ...
// ============================================================================

import { execSync } from 'node:child_process'

void (() => {
  const { version, targets } = parseArgs()
  const workspacesArg = targets.map(target => `-w ${target}`).join(' ')
  if (version !== 'none') run(`npm version ${version} --workspaces-update=false ${workspacesArg}`)
  run(`syncpack fix-mismatches`)
  run(`npm run build ${workspacesArg}`)
  run(`npm publish ${workspacesArg}`)
  run(`npm install`)
})()

function parseArgs() {
  const args = process.argv.slice(2)
  if (args[0] === 'patch' || args[0] === 'minor' || args[0] === 'major' || args[0] === 'none') {
    return { version: args[0], targets: args.slice(1) }
  } else {
    return { version: 'patch', targets: args }
  }
}

function run(command: string) {
  execSync(command, { stdio: 'inherit', cwd: process.cwd(), env: process.env })
}
