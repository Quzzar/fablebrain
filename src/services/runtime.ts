
export const TICK_SPEED = 1000; // 1 second

export const MINOR_SPEED = 10 * TICK_SPEED; // 10 seconds
export const MODERATE_SPEED = 10 * 60 * TICK_SPEED; // 10 minutes
export const GREATER_SPEED = 2 * 60 * 60 * TICK_SPEED; // 2 hours
export const GRAND_SPEED = 12 * 60 * 60 * TICK_SPEED; // 12 hours

export function startRuntime() {
  setInterval(updateMinor, MINOR_SPEED);
  setInterval(updateModerate, MODERATE_SPEED);
  setInterval(updateGreater, GREATER_SPEED);
  setInterval(updateGrand, GRAND_SPEED);
}

async function updateMinor() {

  // 
  await processNewFrames();

}


async function updateModerate() {

}


async function updateGreater() {

}


async function updateGrand() {

}








// Convert new frames into minor fables
async function processNewFrames() {



}

// Convert minor fables into moderate fables
async function convertFables() {



}