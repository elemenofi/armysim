import * as moment from 'moment'
import * as chance from 'chance'
import names from '../names'
import util from '../util'

enum OperationStatus {
  planning = 'planning',
  prepared = 'prepared',
  executed = 'executed',
  revealed = 'revealed',
  failed = 'failed'
}

export class Operation {
  id: number
  name: string
  officer: Officer
  target: Officer
  strength: number
  status: OperationStatus

  constructor (id: number, officer: Officer, target: Officer) {
    this.id = id
    this.name = 'Operation ' + names.nouns[util.random(names.nouns.length)]
    this.officer = officer
    this.target = target
    this.strength = 0
    this.status = OperationStatus.planning
  }

  tick (): void {
    
  }
}

export class Rank {
  tier: number
  max: number

  constructor (tier: number) {
    this.tier = tier
    this.max = tier * 100 * 3
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

  constructor (rank: number) {
    this.rank = new Rank(rank)
    this.experience = 100 * rank + util.random(100)
    this.chance = chance(Math.random)
    this.name = `${this.chance.first({gender: 'male'}) } ${this.chance.last()}`
  }

  tick () {
    this.train()
    if (!this.unit || !this.unit.parent) return
    this.relate()
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

    this.operations = this.operations.filter((operation: Operation) => {
      return operation.status !== OperationStatus.failed &&
        operation.status !== OperationStatus.revealed
    })

    this.operations.forEach((operation) => operation.tick())
  }

  hasOperationAgainst (target: Officer): boolean {
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

export class Operations {
  hq: Headquarter
  OPERATIONID = 0

  constructor (hq: Headquarter) {
    this.hq = hq
  }

  tick (): void {
    this.hq.staff.forEach((officer) => {
      this.plot(officer)
    })
  }

  plot (officer: Officer): void {
    if (!officer.isSenior) this.start(officer, officer.competitor)
    if (officer.isMilitant) this.start(officer, officer.superior)
  }

  start (officer: Officer, target: Officer): void {
    if (!officer || !target) return
    if (officer.operations.length > officer.rank.tier) return
    if (officer.hasOperationAgainst(target)) return    

    const operation = new Operation(this.OPERATIONID, officer, target)
    this.OPERATIONID++

    officer.operations.push(operation)
    officer.events.push(this.hq.log.plot(operation))
  }
}

export class Headquarter {
  UNITID = 0
  OFFICERID = 0
  army: Unit
  oob: Unit[] = []
  staff: Officer[] = []
  reserve: Officer[] = []
  operations: Operations
  inspected: Officer
  log: Logger

  constructor () {
    this.army = this.build(9)    
    const officer = this.recruit(9)

    this.assign(officer, this.army)

    this.generateUnitsTree(8, 2, this.army)

    this.assignSister()

    this.operations = new Operations(this)
  }

  tick (turn: number): void {
    this.staff.forEach((officer) => {
      if (officer.isRetired) {
        this.retire(officer)
      } else {
        officer.tick()
      }
    })

    this.operations.tick()
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
    const recruit = new Officer(tier)
    recruit.id = this.OFFICERID
    this.OFFICERID++
    this.staff.push(recruit)
    return recruit
  }

  private promote (officer: Officer): Officer {
    officer.rank = new Rank(officer.rank.tier + 1)
    officer.events.push(this.log.promote())
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

  private advance () {
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

  promote (): string {
    return this.day() + ' promoted'
  }

  plot (operation: Operation): string {
    return `${this.day()} started ${operation.name} against ${operation.target.name}`
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
      <UIUnit hq={this.props.game.headquarter} unit={this.props.game.headquarter.army}/>
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
    
    o.events.forEach(event => {
      events.push(<div>{event}</div>)
    })
    
    return <div>
      {o.name}
      {events}
    </div>
  }
}

export class UIUnit extends React.Component {
  props: {
    unit: Unit
    hq: Headquarter
  }

  constructor () {
    super()
    this.inspect = this.inspect.bind(this);    
  }

  label (tier: number): {label: string, size: string} {
    return constants.label(tier)
  }

  inspect (e: Event) {
    e.preventDefault()
    e.stopPropagation()
    this.props.hq.inspected = this.props.unit.officer
  }

  subunits () {
    const hq = this.props.hq
    const u = this.props.unit
    const su = u.subunits
    const size = 'unit-' + this.label(u.tier).size

    return <div className='subunits'>
      <div className={size}>
        <UIUnit hq={hq} unit={su[0]}/>
      </div>
      <div className={size}>
        <UIUnit hq={hq} unit={su[1]}/>
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
      document.getElementById('game')
    )
  }
}

const constants = {
  label (tier: number): {label: string, size: string} {
    let result = {
      label: '',
      size: ''
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
  }
}

