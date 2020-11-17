import { Officer } from "./officer";

export enum OperationTypes {
  combat = 'combat',
  intelligence = 'intelligence'
}

export enum OperationStatus {
  planning = 'planning',
  executed = 'executed', 
  failed = 'failed',
  aborted = 'aborted'
}

export class Operation {
  officer: Officer
  target: Officer
  type: OperationTypes
  status: OperationStatus
  updated: Date
  progress: number
  maxTurns: number
  
  constructor (officer: Officer, target: Officer) {
    this.progress = 0
    this.maxTurns = 100
    this.officer = officer
    this.target = target
    this.status = OperationStatus.planning
   }

  tick () {
    if (
      this.status === OperationStatus.failed || 
      this.status === OperationStatus.executed || 
      this.status === OperationStatus.aborted
    ) {
      return
    }

    if (this.officer.inReserve) {
      this.abort()
    }

    this.progress++
    
    if (this.progress === this.maxTurns) this.execute()
  }

  abort () {
    this.status = OperationStatus.aborted
  }

  execute () {
    const log = this.officer.hq.staff.log
    if (this.officer.roll() - 4 > this.target.roll()) {
      this.officer.hq.staff.retire(this.target, this.officer)
      this.officer.events.push(log.retired(this.target))
      this.status = OperationStatus.executed
      this.officer.skill++
    } else {
      this.target.events.push(log.resisted(this.officer))
      this.officer.events.push(log.attempted(this.target))
      this.status = OperationStatus.failed
    }
  }
}

export class Operations {
  officer: Officer
  current: Operation[]

  constructor(officer: Officer) {
    this.officer = officer
    this.current = []
  }

  tick () {
    this.current.forEach(o => o.tick())
  }

  start (target: Officer) {
    if (!this.attempts(target))
    this.current.push(new Operation(this.officer, target))
  }

  attempts(target: Officer): Operation {
    return this.current.find(operation => operation.target.name === target.name)
  }
}