'use strict';
const config = {
  staffSize: 5,
  experience() {
    return Math.round(Math.random() * 10 + 1);
  } 
};
export default config;