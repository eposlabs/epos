import type { IArrayWillChange, IArrayWillSplice, IObjectWillChange } from 'mobx'
import type { YArrayEvent, YMapEvent } from 'yjs'
import type { MNode, YNode } from './state-node.ex.sw'

export type ObjectSet = Extract<IObjectWillChange<Obj>, { type: 'add' | 'update' }>
export type ObjectRemove = Extract<IObjectWillChange<Obj>, { type: 'remove' }>
export type ArraySet = IArrayWillChange<any>
export type ArraySplice = IArrayWillSplice<any>
export type Change = ObjectSet | ObjectRemove | ArraySet | ArraySplice

export class StateObserver extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private applyingRemoteChanges = false // Yjs -> MobX

  observe(node: MNode, yNode: YNode) {
    // Observe mNode
    const mStop = this.$.libs.mobx.intercept(node, this.onMobxChange as any)

    // Observe yNode
    yNode.observe(this.onYChange)
    const yStop = () => yNode.unobserve(this.onYChange)

    // Return unobserve function
    return () => {
      mStop()
      yStop()
    }
  }

  // ---------------------------------------------------------------------------
  // MOBX CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onMobxChange = (change: Change) => {
    // Skip if applying remote changes (Yjs -> MobX)
    if (this.applyingRemoteChanges) return change

    // Process 'change' object:
    // - Convert new values to nodes
    // - Detach removed values
    // - Update corresponding yNode
    if (this.isObjectChange(change)) {
      // - object[newKey] = value (add)
      // - object[existingKey] = value (update)
      if (change.type === 'add' || change.type === 'update') {
        this.processObjectSet(change)
      }
      // - delete object[key]
      else if (change.type === 'remove') {
        this.processObjectRemove(change)
      }
    } else {
      // - array[existingIndex] = value
      if (change.type === 'update') {
        this.processArraySet(change)
      }
      // - array[outOfRangeIndex] = value
      // - array.splice(), array.push(), array.pop(), etc.
      else if (change.type === 'splice') {
        this.processArraySplice(change)
      }
    }

    // Save state to IDB
    async: this.$state.persistence.save()

    return change
  }

  private processObjectSet(c: ObjectSet) {
    // Skip symbols
    if (this.$.is.symbol(c.name)) return

    // Skip if value hasn't changed
    if (c.newValue === c.object[c.name]) return

    // Attach new value
    const mOwner = c.object
    c.newValue = this.$state.node.create(c.newValue, mOwner)

    // Detach old value
    this.$state.node.detach(mOwner[c.name])

    // Update corresponding Yjs node
    this.$state.doc.transact(() => {
      const yOwner = this.$state.node.getYNode(mOwner)
      if (!yOwner) throw this.never
      const key = String(c.name)
      yOwner.set(key, this.$state.node.getYNode(c.newValue) ?? c.newValue)
    })
  }

  private processObjectRemove(c: ObjectRemove) {
    // Skip symbols
    if (this.$.is.symbol(c.name)) return

    // Detach removed value
    const mOwner = c.object
    this.$state.node.detach(mOwner[c.name])

    // Update corresponding Yjs node
    this.$state.doc.transact(() => {
      const yOwner = this.$state.node.getYNode(mOwner)
      if (!yOwner) throw this.never
      const key = String(c.name)
      yOwner.delete(key)
    })
  }

  private processArraySet(c: ArraySet) {
    // Attach new value
    const mOwner = c.object
    c.newValue = this.$state.node.create(c.newValue, mOwner)

    // Detach old value
    this.$state.node.detach(mOwner[c.index])

    // Update corresponding Yjs node
    this.$state.doc.transact(() => {
      const yOwner = this.$state.node.getYNode(mOwner)
      if (!yOwner) throw this.never
      yOwner.delete(c.index)
      yOwner.insert(c.index, [this.$state.node.getYNode(c.newValue) ?? c.newValue])
    })
  }

  private processArraySplice(c: ArraySplice) {
    // Attach added items
    const mOwner = c.object
    c.added = c.added.map(item => this.$state.node.create(item, mOwner))

    // Detach removed items
    for (let i = c.index; i < c.index + c.removedCount; i++) {
      this.$state.node.detach(mOwner[i])
    }

    // Update corresponding Yjs node
    this.$state.doc.transact(() => {
      const yOwner = this.$state.node.getYNode(mOwner)
      if (!yOwner) throw this.never
      const yAdded = c.added.map((value, index) => this.$state.node.getYNode(c.added[index]) ?? value)
      yOwner.delete(c.index, c.removedCount)
      yOwner.insert(c.index, yAdded)
    })
  }

  private isObjectChange(change: Change): change is ObjectSet | ObjectRemove {
    return this.$.is.object(change.object)
  }

  // ---------------------------------------------------------------------------
  // YJS CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onYChange = async (e: YMapEvent<unknown> | YArrayEvent<unknown>) => {
    // Process only remote changes (Yjs -> MobX)
    if (e.transaction.origin !== 'remote') return

    // Apply change to MobX
    if (e instanceof this.$.libs.yjs.YMapEvent) {
      this.applyYMapChange(e)
    } else {
      this.applyYArrayChange(e)
    }

    // Save state to IDB
    async: this.$state.persistence.save()
  }

  private applyYMapChange(e: YMapEvent<unknown>) {
    // Get corresponding MobX node
    const yMap = e.target
    const mNode = this.$state.node.getMNode(yMap)
    if (!mNode) throw this.never

    // Apply Yjs changes to MobX node
    this.$.libs.mobx.runInAction(() => {
      this.applyingRemoteChanges = true

      // Update changed keys
      for (const key of e.keysChanged) {
        // Detach old value
        this.$state.node.detach(mNode[key])

        // Attach new value or delete if the key was removed
        if (yMap.has(key)) {
          this.$state.node.set(mNode, key, yMap.get(key))
        } else {
          this.$state.node.remove(mNode, key)
        }
      }

      this.applyingRemoteChanges = false
    })
  }

  private applyYArrayChange(e: YArrayEvent<unknown>) {
    // Get corresponding MobX node
    const yArray = e.target
    const mNode = this.$state.node.getMNode(yArray)
    if (!mNode) throw this.never

    // Apply Yjs changes to MobX node
    this.$.libs.mobx.runInAction(() => {
      this.applyingRemoteChanges = true

      let offset = 0
      for (const operation of e.delta) {
        // Retain operation? -> Just update offset
        if (operation.retain) {
          offset += operation.retain
        }

        // Delete operation? -> Remove and detach items
        else if (operation.delete) {
          for (let i = offset; i < offset + operation.delete; i++) {
            this.$state.node.detach(mNode[i])
          }
          mNode.splice(offset, operation.delete)
        }

        // Insert operation? -> Create new items
        else if (operation.insert) {
          if (!this.$.is.array(operation.insert)) throw this.never
          const added = operation.insert.map(item => this.$state.node.create(item, mNode))
          mNode.splice(offset, 0, ...added)
          offset += added.length
        }
      }

      this.applyingRemoteChanges = false
    })
  }
}
