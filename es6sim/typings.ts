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
    officer: Officer;
    target: Officer;
    type: string;
    name: string;
    strength: number;
    turns: number;
  }
  interface Officer extends OfficerSpec {
    date?: string;
    lname: string;
    fname: string;
    name(): string;
    id: number;
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
    history: string[];
    rank: Rank;
    operations: Operation[];
    unit: Unit;
    commander: Officer;
    traits: { base: Trait };
    drifts(o: any, traits: any): any;
  }
  interface OfficerSpec {
    date?: string;
    id: number;
    unitId: number;
    rankName?: string;
    isPlayer?: boolean;
  }
  interface Unit {
    name: string;
    parentId: number;
    commander: Officer;
    type: string;
    id: number;
    reserve: Officer[];
    subunits: [Unit, Unit];
  }
  interface HQ {
    operations: Operations;
    rawDate: Dater;
    realDate: string;
    units: [Unit, Unit];
    officers: Officers;
    unitName(unitId: number, name: string): string;
  }
  interface Operations {
    operationsID: number;
    active: Operation[];
    update(HQ): void;
  }
  interface Officers {
    realDate: string;
    update(HQ): void;
    reserve(): void;
    replaceForPlayer: (o: Officer) => Officer;
    replace(o: Officer): void;
    pool: Officer[];
    active: Officer[];
    inspected: Officer;
    __officersID: number;
    secretary: Secretary
    officers: Officers;
    operations: Operation[];
    candidate(s: any): any
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
