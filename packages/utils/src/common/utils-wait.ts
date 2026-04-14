export async function wait(ms: number) {
  await new Promise(r => setTimeout(r, ms))
}
