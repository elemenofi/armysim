
import config from './config'
import hq from './hq'
import Officer from './officer'
import Operation from './operation'

interface Window { army: any }

declare var window: Window

export class Operations {
  operationsID: number
  active: Operation[]

  constructor () {
    this.operationsID = 1
    this.active = []
  }

  add (spec: Partial<Operation>, HQ: hq) {
    const o = spec.officer

    if (o.id === spec.target.id) return
    if (o.operations.length > o.rank.hierarchy + 1) return

    const operation = new Operation(spec)

    operation.id = this.operationsID
    this.operationsID++

    this.active.push(operation)
    o.operations.push(operation)

    return operation
  }

  update (HQ) {
    this.active.forEach((operation) => { this.execute(HQ, operation) })
  }

  execute (HQ: hq, operation: Operation) {
    // console.log('operations', operation)
  }
}

export default Operations
