/* jshint ignore:start */
import React from './lib/react';
import Comparisons from './comparisons';

let comparisons = new Comparisons();

class Ui {
  constructor (spec) {
    this.engine = spec;
  }

  render (army) {
    React.render(
      <Army engine={ this.engine } />,
      document.body
    );
  }
}

class Army extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      army: props.engine.army,
      engine: props.engine
    }
  }

  render() {
    return(
      <div></div>
    );
  }
}

export default Ui;
