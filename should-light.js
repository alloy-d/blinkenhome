var Promise = require("bluebird");

const moment = require("moment");
const SunCalc = require("suncalc");
const triangulate = require("wifi-triangulate");

// When the lights should turn off at night:
const lightsOut = moment().hours(22).minutes(45).seconds(0);

// When the lights should turn on in the morning:
const lightsOn = moment().hours(6).minutes(15).seconds(0);

module.exports = function () {
  // Figure out where in the world we are.
  const location = Promise.fromCallback(triangulate);

  // Once we know where we are, figure out what the sun is doing.
  const sunTimes = location.then(loc => {
    return SunCalc.getTimes(new Date(), loc.lat, loc.lng);
  });

  // Once we know when we'll see the sun,
  // figure out when we should light things up.
  const status = sunTimes.then(times => {
    const now = moment();
    return now.isBetween(lightsOn, times.sunrise) || now.isBetween(times.sunset, lightsOut);
  });

  return status;
}
