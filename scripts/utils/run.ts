import { execSync } from 'node:child_process'

export function run(command: string) {
  execSync(command, { stdio: 'inherit', cwd: process.cwd(), env: process.env })
}
