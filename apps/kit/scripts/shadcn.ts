import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
execSync(`shadcn add ${args.join(' ')}`, { stdio: 'inherit' })
execSync(`prettier --write src`, { stdio: 'inherit' })
