'use strict';

function flight(id, type, f, p ) {
  this.id = id;
  this.type = type;
  this.f = f;
  this.p = p;
}

exports.Flight = flight;
