export class App extends gl.Unit {
  text = 'Welcome'
  value = 0

  ui() {
    return (
      <div class="flex max-w-[600px] flex-col gap-4 p-4">
        <input
          class="rounded-sm bg-gray-200 px-2 py-1 dark:bg-gray-500"
          value={this.text}
          onInput={e => (this.text = e.currentTarget.value)}
        />
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={this.value}
          onInput={e => (this.value = Number(e.currentTarget.value))}
        />
      </div>
    )
  }
}
