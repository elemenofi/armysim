import * as React from 'react'
import { Unit } from '../entities/unit'
import { Headquarter } from '../entities/army'
import { Game } from '../entities/game'
import { constants } from '../entities/util'

export class UIUnit extends React.Component {
    props: {
        unit: Unit
        hq: Headquarter,
        game: Game,
    }

    constructor (props) {
        super(props)
        this.inspect = this.inspect.bind(this)
    }

    label (tier: number): {label: string, size: string} {
        return constants.label(tier)
    }

    inspect (e) {
        e.preventDefault()
        e.stopPropagation()
        this.props.hq.staff.inspect(this.props.unit.officer)
        this.props.game.advance()
    }

    subunits () {
        const hq = this.props.hq
        const u = this.props.unit
        const su = u.subunits
        const size = 'unit-' + this.label(u.tier).size

        return <div className='unit-sub'>
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

        const selected = (
        this.props.hq.staff.inspected &&
        (this.props.unit.officer.id === this.props.hq.staff.inspected.id)
        ) ? 'selected' : ''

        return <div onClick={this.inspect} className={selected}>
        {this.label(u.tier).label}
        {subunits}
        </div>
    }
}