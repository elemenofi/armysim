'use strict';
const config = {
  staffSize: 20,
  experience() {
    return Math.round(Math.random() * 10 + 1);
  } 
};
export default config;