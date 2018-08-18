export interface ArmyStore {
  playerName?: string
}

export class Store {
  state: ArmyStore

  constructor () {
    this.state = {}

    if (!window.localStorage.getItem('armyStorage')) {
      window.localStorage.setItem('armyStorage', '')
    } else {
      this.state = JSON.parse(window.localStorage.getItem('armyStorage'))
    }
  }

  set playerName (value) {
    this.state.playerName = value
    this.updateLocalStorage()
  }

  get playerName () {
    return this.state.playerName
  }

  private updateLocalStorage () {
    window.localStorage.setItem('armyStorage', JSON.stringify(this.state))
  }

}

export const store = new Store()
