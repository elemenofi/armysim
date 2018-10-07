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
  constructor (officer, target) {
    this.progress = 0
    this.maxTurns = 100
    this.officer = officer
    this.target = target
    this.type = this.officer.operations.planning
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
    alert('You have retired, operation aborted')
    this.status = OperationStatus.aborted
  }

  execute () {
    if (this.officer.roll() > this.target.roll()) {
      this.officer.hq.staff.retire(this.target)
      alert('You have forced ' + this.target.fullName() + ' to retire.')
      this.status = OperationStatus.executed
    } else {
      alert('You failed to force ' + this.target.fullName() + ' to retire.')
      this.status = OperationStatus.failed
    }
  }
}

export class OfficerOperations {
  officer: Officer
  private currentPlanning: OperationTypes
  current: Operation[]

  constructor(officer: Officer) {
    this.officer = officer
    this.current = []
  }

  tick () {
    this.current.forEach(o => o.tick())
  }

  set planning (planning: OperationTypes) {
    this.currentPlanning = planning
  }

  get planning (): OperationTypes {
    return this.currentPlanning
  }

  plot (target: Officer) {
    this.current.push(new Operation(this, target))
  }
}