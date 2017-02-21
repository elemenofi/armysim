declare namespace Army {
  interface FirstNameSpec {
    gender: string
  }
  interface Rank {
    hierarchy: number;
    title: string;
    alias: string;
    startxp: number;
    maxxp: number;
    startpr: number;
  }
  interface Trait {
    name: string;
    area: string;
    school: string;
    intelligence: number;
    commanding: number;
    diplomacy: number;
  }
  interface Operation {
    id: number;
    execute(HQ: HQ): void;
    officer: Officer;
    target: Officer;
    type: string;
    name: string;
    strength: number;
    turns: number;
    byPlayer: boolean;
    logged: boolean;
    completed: string;
  }
  interface Officer extends OfficerSpec {
    date?: string;
    lname: string;
    fname: string;
    name(): string;
    id: number;
    chance: any;
    isPlayer: boolean;
    unitId: number;
    reserved: boolean;
    experience: number;
    prestige: number;
    intelligence: number;
    diplomacy: number;
    commanding: number;
    alignment: number;
    militancy: number;
    drift: number;
    history: {events: string[], reason?: Army.Operation};
    rank: Rank;
    operations: Operation[];
    completed: Operation[];
    unit: Unit;
    commander: Officer;
    traits: { base: Trait };
    couped: boolean;
    drifts(o: any): any;
    reserve(HQ: HQ, context?: Operation): void;
    militate(HQ: HQ): void;
    reason: Operation;
    party: string;
    targets: number[];
    operationDelay: number;
  }
  interface OfficerSpec {
    date?: string;
    id: number;
    unitId: number;
    rankName?: string;
    isPlayer?: boolean;
  }
  interface Unit {
    name?: string;
    parentId?: number;
    commander?: Officer;
    type?: string;
    id?: number;
    reserve?: Officer[];
    subunits?: Unit[];
  }
  interface HQ {
    operations: Operations;
    rawDate: Dater;
    realDate: string;
    units: Unit[];
    officers: Officers;
    player: Officer;
    unitName(unitId: number, name: string): string;
    add(u: Unit): void;
    makePlayer(): void;
    update(triggeredByUserAction?: boolean): void;
    findPlayer(): Officer;
    findUnitById(id: number): Unit;
    findCommandingOfficer(o: Officer): Officer;
    findSubordinates(o: Officer)
  }
  interface Operations {
    operationsID: number;
    active: Operation[];
    update(HQ): void;
    add(spec, HQ?): Operation;
  }
  interface Officers {
    realDate: string;
    update(HQ): void;
    replaceForPlayer: (o: Officer) => Officer;
    replace(o: Officer): void;
    pool: Officer[];
    active: Officer[];
    inspected: Officer;
    __officersID: number;
    secretary: Secretary
    officers: Officers;
    operations: Operation[];
    candidate(s: any, replacedCommander?: Officer): any
    recruit(rank: string, unitId: number, isPlayer: boolean, unitName:string): Officer;
  }
  interface Secretary {
    rankLower(r: Rank): string
  }
  interface Dater {
    addDays(n: number): void;
  }
}

export default Army;
