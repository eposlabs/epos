export class Permission extends $sh.Permission {
  ui() {
    const onClick = async () => {
      if (this.granted) {
        await this.test()
      } else {
        await this.request()
      }
    }

    return (
      <div class="flex flex-col">
        <button
          onClick={onClick}
          class="flex cursor-pointer gap-8 rounded-sm bg-gray-200 px-12 py-6 text-left hover:brightness-95"
        >
          <div>{this.granted ? '✅' : '🚫'}</div>
          <div>{this.name}</div>
        </button>
      </div>
    )
  }
}
