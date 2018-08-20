import { Officer } from './officer'

// tslint:disable:max-line-length
export const orders = {
  firstOrder: {
    title: `You have been promoted to Commander in Chief of the National Army:`,
    description: `
      <p>Congratulations General.</p>
      <p>The President is optimistic about the future but warns us about the dangers of extremist ideologies and sectarian rivalries. The Army should show society what order and discipline means. There can be no mistakes. It must be an example of public service and republicanism. We cannot allow autocratic elements to take control of our armed institutions.</p>
      <p>This document represents your promotion to the rank of General and your comission as Commander in Chief of the National Army. Your orders are to keep the Army functioning efficiently and to defend the Constitution.</p>
      <p>Sincerely,</br>
      John Stockenhaim</br>
      Minister of Defence</p>
    ` ,
  },
  chief: {
    personnel: (reserve: Officer[]) => {
      return {
        title: 'The Defense Minister wants you to select your cabinet.',
        description: `
        <p>Please choose a Chief of Personnel.</p>
        <p>The responsabilities of this position include the management of all promotions and retirements. They are in charge of making sure that the army is properly staffed and that all positions have the best officer in command.</p>
        ${1 + 1}`,
      }
    },
  },
}
