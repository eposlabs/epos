// import {
//   IconAlertCircle,
//   IconCircleCheck,
//   IconPackageExport,
//   IconPointFilled,
//   IconRefresh,
//   IconTrash,
// } from '@tabler/icons-react'
// import { Alert, AlertTitle } from '@ui/components/ui/alert'
// import { Button } from '@ui/components/ui/button'
// import { ButtonGroup } from '@ui/components/ui/button-group'
// import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@ui/components/ui/item'
// import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
// import { cn } from '@ui/lib/utils'
// import type { Bundle } from 'epos'
// import type { Spec } from 'epos-spec'

// class _Project_ extends gl.Unit {
//   name: string | null = null
//   spec: Spec | null = null
//   handleId: string
//   updatedAt: number | null = null
//   fs = new gl.ProjectFs(this)

//   get $projects() {
//     return this.closest(gl.Projects)!
//   }

//   get state(): {
//     error: string | null
//     updating: boolean
//   } {
//     return {
//       error: null,
//       updating: false,
//     }
//   }

//   get static(): {
//     handle: FileSystemDirectoryHandle | null
//     bundle: Bundle | null
//     observer: FileSystemObserver | null
//     updateTimer: number
//   } {
//     return {
//       handle: null,
//       bundle: null,
//       observer: null,
//       updateTimer: -1,
//     }
//   }

//   static async new(parent: gl.Unit) {
//     const { $ } = parent

//     // Ask user for a directory handle
//     const [handle] = await $.utils.safe(() => showDirectoryPicker({ mode: 'read' }))
//     if (!handle) return
//   }

//   constructor(parent: gl.Unit, handleId: string) {
//     super(parent)
//     this.handleId = handleId
//   }

//   async attach() {
//     return
//     this.update = this.$.utils.enqueue(this.update)
//     this.static.handle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.handleId)
//     await this.update()
//     this.startObserver()
//   }

//   async detach() {
//     return
//     if (this.static.observer) this.static.observer.disconnect()
//     if (this.name && this.name !== 'kit') await epos.installer.remove(this.name)
//   }

//   select() {
//     this.$projects.selectedProjectId = this.id
//   }

//   async remove() {
//     this.$.projects.state.list.remove(this)
//     await epos.installer.remove(this.id)
//   }

//   isSelected() {
//     return this.$projects.selectedProjectId === this.id
//   }

//   async export(asDev = false) {
//     console.log(`📦 [${this.name}] Export`, { asDev })
//     const blob = await this.zip(asDev)
//     const url = URL.createObjectURL(blob as any as Blob)
//     await epos.browser.downloads.download({ url, filename: `${this.name}.zip` })
//     URL.revokeObjectURL(url)
//   }

//   async update() {
//     // TODO:
//     // maybe instead of $.projects.install
//     // we have $.projects.update(id, bundleOrUrl)
//     // and $.projects.add(id?, bundleOrUrl) => id
//     // this way "name" is not something unique, we can have multiple projects with the same name
//     try {
//       this.state.error = null
//       this.state.updating = true
//       this.static.bundle = await this.readBundle()
//       this.spec = this.static.bundle.spec
//       if (this.name && this.name !== this.static.bundle.spec.name) await epos.installer.remove(this.name)
//       this.name = this.static.bundle.spec.name
//       await epos.installer.install(this.id, this.static.bundle)
//     } catch (e) {
//       console.log(e)
//       this.state.error = this.$.utils.is.error(e) ? String(e) : String(e)
//     } finally {
//       this.updatedAt = Date.now()
//       this.state.updating = false
//     }
//   }

//   private updateWithDelay() {
//     clearTimeout(this.static.updateTimer)
//     this.static.updateTimer = setTimeout(() => this.update(), 50)
//   }

//   private async readBundle(): Promise<Bundle> {
//     const [specHandle] = await this.$.utils.safe(() => this.fs.getFileHandle('epos.json'))
//     if (!specHandle) throw new Error('epos.json not found')

//     const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
//     if (fileError) throw new Error('Failed to read epos.json', { cause: fileError.message })

//     const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
//     if (jsonError) throw new Error('Failed to read epos.json', { cause: jsonError.message })

//     const [spec, specError] = this.$.utils.safeSync(() => this.$.libs.parseSpec(specJson))
//     if (specError) throw new Error('Failed to parse epos.json', { cause: specError.message })

//     const assets: Record<string, Blob> = {}
//     for (const path of spec.assets) {
//       assets[path] = await this.fs.readFile(path)
//     }

//     const sources: Record<string, string> = {}
//     for (const target of spec.targets) {
//       for (const resource of target.resources) {
//         if (sources[resource.path]) continue
//         sources[resource.path] = await this.fs.readFileAsText(resource.path)
//       }
//     }

//     return { mode: 'development', spec, sources, assets }
//   }

//   // ---------------------------------------------------------------------------
//   // OBSERVER
//   // ---------------------------------------------------------------------------

//   private startObserver() {
//     this.static.observer = new FileSystemObserver(records => {
//       if (this.state.error) {
//         this.updateWithDelay()
//         return
//       }

//       for (const record of records) {
//         const path = record.relativePathComponents.join('/')
//         if (this.usesPath(path)) {
//           this.updateWithDelay()
//           return
//         }
//       }
//     })

//     if (!this.static.handle) throw this.never()
//     this.static.observer.observe(this.static.handle, { recursive: true })
//   }

//   // ---------------------------------------------------------------------------
//   // ZIP
//   // ---------------------------------------------------------------------------

//   /** Create standalone extension ZIP file out of the project. */
//   async zip(asDev = false) {
//     const bundle = this.static.bundle
//     if (!bundle) throw new Error('Project is not loaded yet')
//     const zip = new this.$.libs.Zip()

//     const engineFiles = [
//       '/cs.js',
//       '/ex-mini.prod.js',
//       '/ex.prod.js',
//       '/os.js',
//       '/sw.js',
//       '/vw.css',
//       '/vw.js',
//       '/view.html',
//       '/system.html',
//       '/project.html',
//       '/offscreen.html',
//       ...(asDev ? ['/ex-mini.dev.js', '/ex.dev.js'] : []),
//     ]

//     for (const path of engineFiles) {
//       const blob = await fetch(epos.browser.runtime.getURL(path)).then(r => r.blob())
//       zip.file(path.replace('/', ''), blob)
//     }

//     zip.file(
//       'project.json',
//       JSON.stringify(
//         {
//           env: asDev ? 'development' : 'production',
//           spec: bundle.spec,
//           sources: bundle.sources,
//         },
//         null,
//         2,
//       ),
//     )

//     const assets = bundle.assets
//     for (const path in assets) {
//       const blob = assets[path]
//       if (!blob) throw this.never()
//       zip.file(`assets/${path}`, blob)
//     }

//     const icon = bundle.spec.icon
//       ? assets[bundle.spec.icon]
//       : await fetch(epos.browser.runtime.getURL('/icon.png')).then(r => r.blob())
//     if (!icon) throw this.never()
//     zip.file('icon.png', icon)

//     const matchPatterns = new Set<string>()
//     for (const target of bundle.spec.targets) {
//       for (let match of target.matches) {
//         if (match.context === 'locus') continue
//         matchPatterns.add(match.value)
//       }
//     }

//     if (matchPatterns.has('<all_urls>')) {
//       matchPatterns.clear()
//       matchPatterns.add('<all_urls>')
//     }

//     const engineManifestText = await fetch(epos.browser.runtime.getURL('/manifest.json')).then(r => r.text())
//     const engineManifestJson = this.$.libs.stripJsonComments(engineManifestText)
//     const [engineManifest, error] = this.$.utils.safeSync(() => JSON.parse(engineManifestJson))
//     if (error) throw error

//     const manifest = {
//       ...engineManifest,
//       name: bundle.spec.name,
//       version: bundle.spec.version,
//       description: bundle.spec.description ?? '',
//       action: { default_title: bundle.spec.name },
//       host_permissions: [...matchPatterns],
//       // ...(bundle.spec.manifest ?? {}),
//     }

//     console.log(JSON.stringify(manifest, null, 2))

//     // const mandatoryPermissions = [
//     //   'alarms',
//     //   'declarativeNetRequest',
//     //   'offscreen',
//     //   'scripting',
//     //   'tabs',
//     //   'unlimitedStorage',
//     //   'webNavigation',
//     // ]

//     // const permissions = new Set<string>(manifest.permissions ?? [])
//     // for (const perm of mandatoryPermissions) permissions.add(perm)
//     // manifest.permissions = [...permissions].sort()

//     zip.file('manifest.json', JSON.stringify(manifest, null, 2))
//     return await zip.generateAsync({ type: 'blob' })
//   }

//   // ---------------------------------------------------------------------------
//   // HELPERS
//   // ---------------------------------------------------------------------------

//   // private async readSpec() {
//   //   const [specHandle] = await this.$.utils.safe(() => this.fs.getFileHandle('epos.json'))
//   //   if (!specHandle) throw new Error('epos.json not found')

//   //   const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
//   //   if (fileError) throw new Error('Failed to read epos.json', { cause: fileError.message })

//   //   const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
//   //   if (jsonError) throw new Error('Failed to read epos.json', { cause: jsonError.message })

//   //   const [spec, specError] = this.$.utils.safeSync(() => this.$.libs.parseSpec(specJson))
//   //   if (specError) throw new Error('Failed to parse epos.json', { cause: specError.message })

//   //   return spec
//   // }

//   usesPath(path: string) {
//     if (path === 'epos.json') return true
//     if (!this.spec) return false

//     for (const assetPath of this.spec.assets) {
//       if (path === assetPath) return true
//     }

//     for (const target of this.spec.targets) {
//       for (const resource of target.resources) {
//         if (path === resource.path) return true
//       }
//     }

//     return false
//   }

//   private getTimeString(time: number) {
//     const hhmmss = new Date(time).toString().split(' ')[4]
//     const ms = new Date(time).getMilliseconds().toString().padStart(3, '0')
//     return `${hhmmss}:${ms}`
//   }

//   // ---------------------------------------------------------------------------
//   // VIEW
//   // ---------------------------------------------------------------------------

//   View() {
//     return (
//       <div className="flex flex-col gap-2 bg-white p-4 dark:bg-black">
//         <Item>
//           <ItemMedia variant="icon">
//             <IconCircleCheck className="text-green-500" />
//           </ItemMedia>
//           <ItemContent>
//             <ItemTitle>{this.name ?? 'unknown'}</ItemTitle>
//             {this.updatedAt && (
//               <ItemDescription>Updated at {this.getTimeString(this.updatedAt)}</ItemDescription>
//             )}
//           </ItemContent>
//           <ItemActions>
//             <ButtonGroup>
//               {!this.state.error && (
//                 <Button variant="outline" onClick={e => this.export(e.shiftKey)}>
//                   <IconPackageExport /> EXPORT
//                 </Button>
//               )}
//               <Button variant="outline" onClick={this.update}>
//                 <IconRefresh /> REFRESH
//               </Button>
//               <Button variant="outline" onClick={this.remove}>
//                 <IconTrash /> REMOVE
//               </Button>
//             </ButtonGroup>
//           </ItemActions>
//         </Item>

//         <this.ErrorView />
//       </div>
//     )
//   }

//   ErrorView() {
//     if (!this.state.error) return null
//     return (
//       <Alert variant="destructive">
//         <IconAlertCircle />
//         <AlertTitle>{this.state.error}</AlertTitle>
//         {/* {this.$.utils.is.string(this.state.error) && <AlertDescription>{this.state.error}</AlertDescription>} */}
//       </Alert>
//     )
//   }

//   SidebarView() {
//     return (
//       <SidebarMenuItem>
//         <SidebarMenuButton isActive={this.isSelected()} onClick={this.select}>
//           <IconPointFilled className={cn('text-green-500', this.state.error && 'text-red-500')} />
//           <div>{this.name ?? '<unknown>'}</div>
//         </SidebarMenuButton>
//       </SidebarMenuItem>
//     )
//   }
// }

// // // TODO: do not remove, should show error in UI and re-connect button
// // // Project's handle was removed from IDB? -> Remove project itself
// // const handle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.handleId)
// // if (!handle) {
// //   this.remove()
// //   return
// // }

// // // Check handle permission
// // // TODO: handle different browser settings
// // const status = await handle.queryPermission({ mode: 'read' })
// // if (status !== 'granted') {
// //   this.state.error = 'Enable file access in the browser'
// //   return
// // }

// // this.handle = handle
// // this.startObserver()
// // await this.update()

// // private async update() {
// //   try {
// //     this.state.error = null
// //     const startedAt = Date.now()
// //     const spec = await this.readSpec()

// //     // Name has been changed? -> Remove project from epos extension
// //     if (spec.name && this.name && this.name !== spec.name) {
// //       await epos.installer.remove(this.name)
// //     }

// //     // Update spec and name
// //     this.spec = spec
// //     this.name = spec.name ?? null

// //     // Read assets
// //     const assets: Record<string, Blob> = {}
// //     for (const path of this.spec.assets) {
// //       assets[path] = await this.fs.readFile(path)
// //     }

// //     // Read sources
// //     const sources: Record<string, string> = {}
// //     for (const target of this.spec.targets) {
// //       for (const resource of target.resources) {
// //         if (sources[resource.path]) continue
// //         sources[resource.path] = await this.fs.readFileAsText(resource.path)
// //       }
// //     }

// //     // Prepare & install bundle
// //     const bundle: Bundle = { mode: 'development', spec: this.spec, sources, assets }
// //     this.bundle = bundle
// //     await epos.installer.install(bundle)

// //     // Done
// //     this.updatedAt = Date.now()
// //     const time = this.updatedAt - startedAt
// //     console.log(
// //       `✅ [${this.name}] Updated in ${time}ms %c| ${this.getTimeString(this.updatedAt)}`,
// //       'color: gray',
// //     )
// //   } catch (e) {
// //     this.state.error = this.$.utils.is.error(e) ? e.message : String(e)
// //     if (this.$.utils.is.error(e)) {
// //       this.state.errorDetails = e.cause ? String(e.cause) : null
// //     }
// //     this.updatedAt = Date.now()
// //     console.error(`⛔ [${this.name}] Failed to update`, e)
// //   }
// // }
