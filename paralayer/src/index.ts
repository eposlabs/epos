import { Paralayer, type Options } from './paralayer.ts'

export async function paralayer(options: Options) {
  const pl = new Paralayer(options)
  await pl.start()
  return await pl.readSetupJs()
}

export default paralayer
