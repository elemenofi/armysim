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
  constructor (props) {
    super (props);
    this.state = {
      army: props.engine.army,
      engine: props.engine
    }
  }

  render () {
    var army = this.state.army;
    var engine = this.state.engine;

    return (
      <div>
        <Date hq={ army.HQ } engine={ engine } />
        <Player player={ army.HQ.player } />
      </div>
    );
  }
}

class Date extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      hq: this.props.hq,
      engine: this.props.engine
    };
  }

  pause () {
    this.state.engine.pause();
  }

  render () {
    return (
      <div onClick={ this.pause.bind(this) }>{ this.state.hq.realDate }</div>
    );
  }
}

class Player extends React.Component {
  constructor (props) {
    super (props);
    this.state = this.props.player;
  }

  render () {
    return (
      <div>{ this.state.name() }</div>
      <Office officer={this.state} />
    );
  }
}

class Office extends React.Component {
  constructor (props) {
    super (props);
    this.state = this.props.officer;
  }

  render () {
    return (
      <div>{ this.state.name() }</div>
    );
  }
}



export default Ui;
