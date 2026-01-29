import { enqueue, is, link, Queue, safe, safeSync, wait } from '@eposlabs/utils'
import { zip } from './utils-zip.js'

export class Utils extends gl.Unit {
  declare enqueue: typeof enqueue
  declare is: typeof is
  declare link: typeof link
  declare Queue: typeof Queue
  declare safe: typeof safe
  declare safeSync: typeof safeSync
  declare wait: typeof wait
  declare zip: typeof zip
}

Object.assign(Utils.prototype, {
  enqueue,
  is,
  link,
  Queue,
  safe,
  safeSync,
  wait,
  zip,
})

// View() {
//   return (
//     <Dialog open={this.state.show} onOpenChange={open => (this.state.show = open)}>
//       <DialogContent className="w-120 max-w-none!">
//         <DialogHeader>
//           <DialogTitle>{this.state.mode === 'create' ? 'Create New Project' : 'Connect Existing Project'}</DialogTitle>
//           <DialogDescription>
//             {this.state.mode === 'create' ? 'Create a new project from a template.' : 'Connect an existing EPOS project.'}
//           </DialogDescription>
//         </DialogHeader>

//         <Separator />
//         <div className="space-y-6">
//           <div className="space-y-3">
//             <Label className="font-semibold">Directory</Label>
//             <div>
//               <FieldDescription className="mb-2">
//                 {!this.state.dirHandle && <>Select your project directory.</>}
//                 {!!this.state.dirHandle && (
//                   <div>
//                     You have selected directory <strong>./{this.state.dirHandle.name}</strong>
//                   </div>
//                 )}
//               </FieldDescription>
//               {!!this.state.dirHandle && (
//                 <Button variant="outline" size="sm" onClick={() => this.selectDirectory()}>
//                   <IconFolderOpen className="mr-2 inline-block" />
//                   Change Directory
//                 </Button>
//               )}
//               {!this.state.dirHandle && (
//                 <Button variant="outline" size="sm" onClick={() => this.selectDirectory()}>
//                   <IconFolderUp className="mr-2 inline-block" />
//                   Select Directory
//                 </Button>
//               )}
//             </div>
//           </div>

//           {this.state.mode === 'create' && (
//             <>
//               <Separator />
//               <div className="space-y-3">
//                 <Label className="font-semibold">Template</Label>
//                 <RadioGroup
//                   value={this.state.template}
//                   onValueChange={value => (this.state.template = value as Template)}
//                   className="w-fit"
//                 >
//                   <Label>
//                     <Field orientation="horizontal">
//                       <RadioGroupItem value="default" />
//                       <FieldContent>
//                         <div>Default</div>
//                         <FieldDescription>Vite + TypeScript + TailwindCSS</FieldDescription>
//                       </FieldContent>
//                     </Field>
//                   </Label>
//                   <Label>
//                     <Field orientation="horizontal">
//                       <RadioGroupItem value="empty" />
//                       <FieldContent>
//                         <div>Empty</div>
//                         <FieldDescription>Manually setup project or connect an existing one</FieldDescription>
//                       </FieldContent>
//                     </Field>
//                   </Label>
//                   <Label>
//                     <Field orientation="horizontal">
//                       <RadioGroupItem value="units" />
//                       <FieldContent>
//                         <div>Unit-based</div>
//                         <FieldDescription>For internal usage, not documented</FieldDescription>
//                       </FieldContent>
//                     </Field>
//                   </Label>
//                 </RadioGroup>
//               </div>
//             </>
//           )}

//           {this.state.dirHandle && !this.state.isDirEmpty && this.state.mode === 'create' && (
//             <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
//               <IconAlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
//               <AlertTitle className="text-yellow-800 dark:text-yellow-200">Directory not empty</AlertTitle>
//               <AlertDescription className="text-yellow-700 dark:text-yellow-300">
//                 The selected directory is not empty. Creating a project here may overwrite existing files.
//               </AlertDescription>
//             </Alert>
//           )}

//           {this.state.dirHandle && !this.state.hasEposJson && this.state.mode === 'connect' && (
//             <Alert variant="default" className="border-red-500/50 bg-red-50 dark:bg-red-950/30">
//               <IconAlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
//               <AlertTitle className="text-red-800 dark:text-red-200">epos.json not found</AlertTitle>
//               <AlertDescription className="text-red-700 dark:text-red-300">
//                 This directory does not contain an epos.json file. Please select a valid EPOS project directory.
//               </AlertDescription>
//             </Alert>
//           )}
//         </div>

//         <DialogFooter className="-m-4 mt-4 border-t border-border p-4">
//           <DialogClose asChild>
//             <Button variant="outline">Cancel</Button>
//           </DialogClose>
//           <Button
//             disabled={!this.canProceed}
//             onClick={() => (this.state.mode === 'create' ? this.createProject() : this.connectProject())}
//           >
//             {this.state.mode === 'create' ? 'Create Project' : 'Connect Project'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
