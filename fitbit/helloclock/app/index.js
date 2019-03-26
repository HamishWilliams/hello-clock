/*
   Hello Clock fitbit clock
   ------------------------
   
   Author: Hamish A Williams
   
   Date:   24 March 2019
   
   A first attempt at writing a clock for the Fitbit ... the equivalent of a "hello world" application.
*/   


import { BodyPresenceSensor } from "body-presence";
import clock from "clock"; 
import document from "document"; 
import { preferences, units } from "user-settings"; 
import { zeroPad, formatCount, monoDigits, } from "../common/utils"; 
import { HeartRateSensor } from "heart-rate";
import { display } from "display";
import { battery } from "power";
import { user } from "user-profile";
import userActivity from "user-activity"; //adjusted types (matching the stats that you upload to fitbit.com, as opposed to local types)
import * as health from "user-activity";


clock.granularity = "seconds";      // A clock can "tick" every seconds, minutes, or hours.


// Get links to the labels specified in the index.gui file.
const batteryLabel = document.getElementById("batteryLabel");
const heartrateLabel = document.getElementById("heartrateLabel");
const helloclockLabel = document.getElementById("helloclockLabel");
const timeLabel = document.getElementById("timeLabel"); 
const activityLabel = document.getElementById("activityLabel");
const caloriesLabel = document.getElementById("caloriesLabel");
const stepsLabel = document.getElementById("stepsLabel");
const distanceLabel = document.getElementById("distanceLabel");
const floorsLabel = document.getElementById("floorsLabel");


let lastUpdatedRings = 0;
let activeRing = document.getElementById("activering");
let calorieRing = document.getElementById("caloriering");
let stepRing = document.getElementById("stepring");
let distanceRing = document.getElementById("distancering");
let floorRing = document.getElementById("floorring");



const hrm = new HeartRateSensor();
if (HeartRateSensor) {
  display.addEventListener("change", () => {
    // Stop the sensor when the screen is off to conserve battery
    display.on ? hrm.start() : hrm.stop();
  });
  hrm.start();
}



hrm.onreading = function() {
  let heartRate = 0;
  
  if (BodyPresenceSensor) {
    const body = new BodyPresenceSensor();
	body.start();
    if (body.present) {
	  heartRate = hrm.heartRate;
	}
	body.stop();
  }
  
  if (heartRate > 0) {
      heartrateLabel.text = `${hrm.heartRate}/${user.restingHeartRate}`; 
  } else {
	  heartrateLabel.text = `--/${user.restingHeartRate}`; 
  }	  
}



function updateClock() {
  var today = new Date();
  var hours = monoDigits(today.getHours());
  var mins = monoDigits(zeroPad(today.getMinutes()));
  var secs = monoDigits(zeroPad(today.getSeconds()));

  // Modify the hours value to deal with whether the user's preference is for 12h or 24h clock
  if (preferences.clockDisplay === "12h") {    
    hours = hours % 12 || 12; 
  }
  hours - monoDigits(zeroPad(hours));

  timeLabel.text = hours + ":" + mins //+ ":" + secs;
}



function updateRing(ring, today, goal, defaultgoal) {
  let angle = (today || 0) * 360 / (goal || defaultgoal);
  
  ring.sweepAngle = Math.min(360, Math.round(angle));
}



clock.ontick = (evt) => {
  const updatePause = 5000;   /* Only update counts every five(?) seconds. */
  const now = evt.date; 
  
  updateClock();
  
  let nowTime = now.getTime();
  if(nowTime - lastUpdatedRings > updatePause) {
    let today = health.today.adjusted;
    let goal = health.goals;
	
	let activityValue = (userActivity.today.local.activeMinutes || 0);
    let activityString = formatCount(activityValue);
	activityLabel.text = activityString;
  
    let caloriesValue = (userActivity.today.local.calories || 0);
    let caloriesString = formatCount(caloriesValue);
    caloriesLabel.text = caloriesString;
  
    let stepsValue = (userActivity.today.local.steps);
    let stepsString = formatCount(stepsValue); 
    stepsLabel.text = stepsString; 

    let distanceValue = (userActivity.today.local.distance);
    let distanceGoal = goal.distance;
    if (units.distance === "us") {
	  /* Convert distances to Imperial */	
	  distanceValue = distanceValue / 1.6;
	  distanceGoal = distanceGoal / 1.6;
    }	
    distanceValue = distanceValue / 1000;
    distanceGoal = distanceGoal / 1000;
    let distanceString = formatCount(distanceValue); 
    distanceLabel.text = distanceString; 
    updateRing(distanceRing, distanceValue, distanceGoal, 10000);

    let floorsValue = (userActivity.today.local.elevationGain || 0);
    let floorsString = formatCount(floorsValue);
    floorsLabel.text = floorsString;
  
    let batteryValue = battery.chargeLevel; 
    batteryLabel.text = `${batteryValue}%`; 
  
    updateRing(activeRing, today.activeMinutes, goal.activeMinutes, 30);
    updateRing(calorieRing, today.calories, goal.calories, 3500); 
    updateRing(stepRing, today.steps, goal.steps, 10000);
    updateRing(floorRing, today.elevationGain, goal.elevationGain, 20);
	
    lastUpdatedRings = nowTime;
  }
  
  helloclockLabel.text = "hello clock";
}  
