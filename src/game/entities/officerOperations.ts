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
    this.type = this.officer.operations.currentPlanning
   }

  tick () {
    this.progress++
    if (this.progress === this.maxTurns) this.execute()
  }

  execute () {
    if (this.officer.roll() > this.target.roll()) {
      this.officer.hq.staff.retire(this.target)
      alert('You have forced ' + this.target.fullName() + ' to retire.')
    } else {
      alert('You failed to force ' + this.target.fullName() + ' to retire.')
    }
  }
}

export class OfficerOperations {
  officer: Officer
  currentPlanning: OperationTypes
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