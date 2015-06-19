/* jshint ignore:start */
import React from './react';

class Ui {
  start() {
    React.render(<HelloMessage name="Sebastian" />, document.getElementById('game'));
  }
}

class HelloMessage extends React.Component {
  render() {
    console.log("Hi");
    return <div>{ this.props.name }</div>;
  }
}

export default Ui;