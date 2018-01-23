import * as moment from 'moment'
import * as chance from 'chance'
import names from './names'
import util from './util'

enum OperationStatus {
  abandoned = 'abandoned',
  started = 'started',
  executed = 'executed',
  failed = 'failed'
}

export class Operation {
  id: number
  name: string
  officer: Officer
  target: Officer
  strength: number
  turns: number
  status: OperationStatus
  hq: Headquarter

  constructor (officer: Officer, target: Officer, hq: Headquarter) {
    this.hq = hq
    this.name = 'Operation ' + names.nouns[util.random(names.nouns.length)]
    this.officer = officer
    this.target = target
    this.strength = 0
    this.status = OperationStatus.started
    this.turns = 365
  }

  tick (): void {
    if (
      this.strength === 100 && 
      this.status === OperationStatus.started
    ) {
      this.execute()
    }

    if (
      this.status === OperationStatus.executed || 
      this.status === OperationStatus.failed ||
      this.status === OperationStatus.abandoned
    ) {
      return
    }
    
    if (this.turns <= 0) {
      this.officer.events.push(this.hq.log.plot(OperationStatus.abandoned, this))
      this.status = OperationStatus.abandoned
      return
    }

    this.turns--

    if (util.random(10) + this.officer.rank.tier > util.random(10) + this.target.rank.tier) {
      this.strength++
    }
  }

  execute (): void {
    if (util.random(10) + this.officer.rank.tier > util.random(10) + this.target.rank.tier) {
      this.officer.events.push(this.hq.log.plot(OperationStatus.executed, this))      
      this.status = OperationStatus.executed
    } else {
      this.officer.events.push(this.hq.log.plot(OperationStatus.failed, this))      
      this.status = OperationStatus.failed
    }
  }
}

export class Rank {
  tier: number
  max: number

  constructor (tier: number) {
    this.tier = tier
    this.max = tier * 100 * 3
  }

  names = [
    'Lieutenant',
    'Captain', 
    'Major', 
    'Lieutenant Coronel', 
    'Coronel', 
    'Brigade General', 
    'Division General', 
    'Lieutenant General', 
    'General'
  ]

  name (): string {
    return this.names[this.tier - 1]
  }
}

export class Officer {
  id: number
  name: string
  experience: number
  rank: Rank
  unit: Unit
  status: string
  superior: Officer
  competitor: Officer
  timeLeftInRank: number
  isMilitant: boolean
  isRetired: boolean
  isSenior: boolean
  events: string[] = []
  operations: Operation[] = []
  chance: any

  constructor (rank: number, private hq: Headquarter) {
    this.rank = new Rank(rank)
    this.experience = 100 * rank + util.random(100)
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({gender: 'male'}) } ${this.chance.last()}`
  }

  tick () {
    this.train()
    if (!this.unit || !this.unit.parent) return
    this.relate()
    this.operate()
    this.plot()
  }

  fullName (): string {
    return `${this.rank.name()} ${this.name}`
  }

  private train () {
    this.experience++
    this.timeLeftInRank = this.rank.max - this.experience
    this.isRetired = this.experience > this.rank.max
  }

  private relate () {
    const parent = this.unit.parent
    this.superior = parent.officer
    this.competitor = this.unit.sister.officer
    this.isMilitant = this.timeLeftInRank < this.superior.timeLeftInRank
    this.isSenior = this.experience > this.competitor.experience
  }

  private operate () {
    if (!this.operations.length) return
    this.operations.forEach((operation) => operation.tick())
  }

  private plot (): void {
    let target: Officer = undefined

    if (!this.isSenior) {
      target = this.competitor
    } else if (this.isMilitant) {
      target = this.superior
    }

    if (!target) return
    if (this.operations.length > this.rank.tier) return
    if (this.hasOperationAgainst(target)) return    

    const operation = new Operation(this, target, this.hq)

    this.operations.push(operation)
    this.events.push(this.hq.log.plot(OperationStatus.started, operation))
  }

  private target (target: Officer): void {
    if (!target) return
    
  }

  private hasOperationAgainst (target: Officer): boolean {
    return this.operations
      .map((operation) => operation.target)
      .includes(target)
  }
}

export class Unit {
  id: number
  name: string
  tier: number
  officer: Officer
  parent: Unit
  sister: Unit
  subunits: Unit[] = []

  constructor (tier: number) {
    this.tier = tier
  }
}

export class Headquarter {
  UNITID = 0
  OFFICERID = 0
  army: Unit
  oob: Unit[] = []
  staff: Officer[] = []
  reserve: Officer[] = []
  inspected: Officer
  log: Logger

  constructor () {
    this.army = this.build(9)    
    const officer = this.recruit(9)

    this.assign(officer, this.army)

    this.generateUnitsTree(8, 2, this.army)

    this.assignSister()
  }

  tick (turn: number): void {
    this.staff.forEach((officer) => {
      if (officer.isRetired) {
        this.retire(officer)
      } else {
        officer.tick()
      }
    })
  }

  private retire (officer: Officer): Officer {
    this.reserve.push(officer)
    this.staff = this.staff.filter((o) => officer.id !== o.id )
    this.replace(officer)
    return officer
  }

  private replace (officer: Officer): Officer {
    let replacement: Officer

    if (officer.rank.tier === 1) {
      replacement = this.recruit(1)
    } else {
      const subunits = officer.unit.subunits
      const officer1 = subunits[0].officer
      const officer2 = subunits[1].officer

      replacement = (officer1.experience > officer2.experience)
        ? officer1
        : officer2
      
      this.replace(replacement)
      this.promote(replacement)
    }

    this.assign(replacement, officer.unit)
    
    return replacement
  }

  private recruit (tier: number): Officer {
    const recruit = new Officer(tier, this)
    recruit.id = this.OFFICERID
    this.OFFICERID++
    this.staff.push(recruit)
    return recruit
  }

  private promote (officer: Officer): Officer {
    officer.rank = new Rank(officer.rank.tier + 1)
    officer.events.push(this.log.promote(officer.rank.name()))
    return officer
  }

  private assign (officer: Officer, unit: Unit): Officer {
    unit.officer = officer
    officer.unit = unit
    return officer
  }

  private build (tier: number): Unit {
    const unit = new Unit(tier)
    unit.id = this.UNITID
    this.UNITID++
    if (tier < 9) this.oob.push(unit)
    return unit
  }

  private assignParent (unit: Unit, parent: Unit): Unit {
    unit.parent = parent
    parent.subunits.push(unit)
    return unit
  }

  private assignSister (): void {
    this.oob.forEach((unit) => {
      if (unit.parent) {
        unit.sister = unit.parent.subunits.find((u) => {
          return u.id !== unit.id
        })
      }
    })
  }

  private generateUnitsTree (tier: number, quantity: number, parent: Unit): void {
    if (quantity === 0 || tier < 1) {
      return
    } else {
      const unit = this.build(tier)
      const officer = this.recruit(tier)

      this.assign(officer, unit)
      this.assignParent(unit, parent)

      this.generateUnitsTree(tier - 1, 2, unit)
      this.generateUnitsTree(tier, quantity - 1, parent)
    }
  }
}

export class Game {
  ui: UI
  headquarter: Headquarter
  keyboard: Keyboard
  turn = 0
  status = 'playing'

  constructor () {
    this.headquarter = new Headquarter()
    this.headquarter.log = new Logger(this)
    this.ui = new UI()
    this.keyboard = new Keyboard(this)

    this.tick()
  }

  pause () {
    if (this.status === 'playing') {
      this.status = 'paused'
    } else {
      this.status = 'playing'
      this.tick()
    }
  }

  private tick () {
    // if (this.turn === 0) {
    //   for (var i = 0; i < 2000; i++) {
    //     this.advance()
    //   }
    // }

    if (this.status === 'paused') return

    // if (this.turn >= 1500) debugger

    this.advance()

    setTimeout(() => this.tick())
  }

  public advance () {
    this.turn++
    this.headquarter.tick(this.turn)
    this.ui.render(this)
  }
}

export class Logger {
  game: Game

  constructor (game: Game) {
    this.game = game
  }

  day (): string {
    return moment()
      .add(this.game.turn * 10, 'days')
      .format('YYYY-MM-DD')
  }

  promote (newRank: string): string {
    return this.day() + ' promoted to ' + newRank
  }

  plot (stage: OperationStatus, operation: Operation): string {
    return `${this.day()} ${stage} ${operation.name} against ${operation.target.fullName()}`
  }
}

class Keyboard {
  game: Game

  constructor (game: Game) {
    this.game = game
    this.bindHotkeys()
  }

  bindHotkeys () {
    window.addEventListener('keydown', (event) => {
      if (event.keyCode === 32 && event.target === document.body) {
        event.preventDefault()
        this.game.pause()
      }
    })
  }
}

import * as React from 'react'
import * as ReactDOM from 'react-dom'

export class UIMain extends React.Component {
  props: {
    game: Game
  }

  render () {
    return <div className='army'>
      <h1>{this.props.game.turn}</h1>
      <UIOfficer officer={this.props.game.headquarter.inspected}/>
      <UIUnit hq={this.props.game.headquarter} unit={this.props.game.headquarter.army} game={this.props.game}/>
    </div>
  }
}

export class UIOfficer extends React.Component {
  props: {
    officer: Officer
  }

  render () {
    const o = this.props.officer
    
    if (!o) return <div>Click on an officer to inspect it</div>

    let events: string[] = []

    o.events.forEach((event) => {
      events.push(<div>{event}</div>)
    })

    let operations: string[] = []

    o.operations.forEach((operation) => {
      operations.push(<div>{operation.name} {operation.status} {operation.turns} {operation.strength}</div>)
    })

    return <div>
      {o.fullName()}
      {events}
      {operations}
    </div>
  }
}

export class UIUnit extends React.Component {
  props: {
    unit: Unit
    hq: Headquarter,
    game: Game,
  }

  constructor () {
    super()
    this.inspect = this.inspect.bind(this)
  }

  label (tier: number): {label: string, size: string} {
    return constants.label(tier)
  }

  inspect (e: Event) {
    e.preventDefault()
    e.stopPropagation()
    this.props.hq.inspected = this.props.unit.officer
    this.props.game.advance()
  }

  subunits () {
    const hq = this.props.hq
    const u = this.props.unit
    const su = u.subunits
    const size = 'unit-' + this.label(u.tier).size

    return <div className='subunits'>
      <div className={size}>
        <UIUnit hq={hq} unit={su[0]} game={this.props.game}/>
      </div>
      <div className={size}>
        <UIUnit hq={hq} unit={su[1]} game={this.props.game}/>
      </div>
    </div>
  }

  render () {
    const u = this.props.unit

    const subunits = (u.subunits.length)
      ? this.subunits() : undefined

    return <div onClick={this.inspect}>
      {this.label(u.tier).label}
      {subunits}
    </div>
  }
}

export class UI extends React.Component {
  render (game: Game) {
    ReactDOM.render(
      <UIMain game={game} />,
      document.getElementById('game'),
    )
  }
}

const constants = {
  label (tier: number): {label: string, size: string} {
    const result = {
      label: '',
      size: '',
    }

    if (tier === 1) {
      result.label = '*'
      result.size = 'small'
    }

    if (tier === 2) {
      result.label = '**'
      result.size = 'small'
    }

    if (tier === 3) {
      result.label = '***'
      result.size = 'small'
    }

    if (tier === 4) {
      result.label = '****'
      result.size = 'small'
    }

    if (tier === 5) {
      result.label = '★'
      result.size = 'small'
    }

    if (tier === 6) {
      result.label = '★★'
      result.size = 'big'
    }

    if (tier === 7) {
      result.label = '★★★'
      result.size = 'big'
    }

    if (tier === 8) {
      result.label = '★★★★'
      result.size = 'big'
    }

    if (tier === 9) {
      result.label = '★★★★★'
      result.size = 'big'
    }

    return result
  },
}
