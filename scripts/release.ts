// Usage:
// > npm run release [...workspaces] [patch|minor|major]
// ============================================================================

import { run } from '@eposlabs/utils/node'

void (() => {
  const { workspaces, version } = parseArgs()
  const workspacesArg = workspaces.map(workspace => `-w ${workspace}`).join(' ')
  if (version) run(`npm version ${version} --workspaces-update=false ${workspacesArg}`)
  run(`syncpack fix`) // "^2.0.0" -> "2.0.1"
  run(`syncpack fix`) // "2.0.1" -> "^2.0.1"
  run(`npm run build --if-present ${workspacesArg}`)
  run(`npm publish ${workspacesArg}`)
  run(`npm install`)
})()

function parseArgs() {
  const args = process.argv.slice(2)
  const lastArg = args.at(-1)
  if (lastArg === 'patch' || lastArg === 'minor' || lastArg === 'major') {
    return { workspaces: args.slice(0, -1), version: lastArg }
  } else {
    return { workspaces: args, version: null }
  }
}
