import { Officer } from "./officer";

export enum OperationTypes {
  field = 'field',
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
  
  constructor (officer: Officer, target: Officer, type: OperationTypes) {
    this.progress = 0
    this.maxTurns = 100
    this.officer = officer
    this.target = target
    this.status = OperationStatus.planning
    this.type = type
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

    if (this.target.id !== this.officer.superior().id) {
      this.abort()
    }

    if (this.officer.roll(this.type) + this.target.roll(this.type)) this.progress++
    
    if (this.progress === this.maxTurns) this.execute()
  }

  abort () {
    this.status = OperationStatus.aborted
  }

  execute () {
    const log = this.officer.hq.staff.log

    if (this.officer.roll(this.type) - this.target.rank.tier > this.target.roll(this.type)) {
      this.officer.hq.staff.retire(this.target, this.officer)
      this.officer.events.push(log.retired(this.target))
      this.status = OperationStatus.executed
      this.officer.prestige++
      console.log('won')
    } else {
      this.target.events.push(log.resisted(this.officer))
      this.officer.events.push(log.failed(this.target))
      this.target.prestige++
      this.officer.prestige--
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
    let type
    
    if (this.officer.getTotalSkillValue(OperationTypes.intelligence) > this.officer.getTotalSkillValue(OperationTypes.field)) {
      type = OperationTypes.intelligence
    }  else {
      type = OperationTypes.field
    }

    if (!this.attempts(target)) {
      const operation = new Operation(this.officer, target, type)
      this.current.push(operation)
      this.officer.hq.log.started(operation);
    }
  }

  attempts(target: Officer): Operation {
    return this.current.find(operation => operation.target.name === target.name)
  }

  stop () {
    this.current.forEach(operation => operation.status = OperationStatus.aborted)
  }
}