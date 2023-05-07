console.log("Running maze_1 script...");

let currentCoords = [1, 1];
const map = [ // 9x9
  [1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
  [1, 0, 1, 0, 0, 0, 1, 3, 1], // 1
  [1, 0, 1, 1, 0, 1, 1, 0, 1], // 2
  [1, 0, 0, 0, 0, 1, 0, 0, 1], // 3
  [1, 0, 1, 1, 0, 1, 0, 1, 1], // 4
  [1, 1, 1, 0, 0, 1, 0, 0, 1], // 5
  [1, 0, 0, 0, 1, 1, 1, 0, 1], // 6
  [1, 0, 1, 0, 0, 0, 0, 0, 1], // 7
  [1, 1, 1, 1, 1, 1, 1, 1, 1], // 8
];

// Runtime
let frame = 1;

async function runtime(){
  if(onStar()){
    console.log("Found star!");
    process.exit();
  }
  
  // Send input to server
  const input_res = await fetch(`http://localhost:3000/api/v1/input`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + "testing",
    },
    body: JSON.stringify({
      info: readSurroundings(),
      goal: "Leave maze by finding the star",
    }),
  });
  const input_response = await input_res.json<any>();
  if(input_response.status !== "success"){
    console.error("Error while fetching input");
    console.error(input_response);
    process.exit();
  }

  // Fetch output from server
  const output_res = await fetch(`http://localhost:3000/api/v1/output`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + "testing",
    },
  });
  const output_response = await output_res.json<any>();
  if(output_response.status !== "success"){
    console.error("Error while fetching output");
    console.error(output_response);
    process.exit();
  }

  // Update position
  updateCoords(output_response.data.action);

  printMap(output_response.data.action, frame);
  frame++;
  await runtime();
}

function readSurroundings() {
  const surroundings = {
    up: map[currentCoords[0] - 1][currentCoords[1]],
    down: map[currentCoords[0] + 1][currentCoords[1]],
    left: map[currentCoords[0]][currentCoords[1] - 1],
    right: map[currentCoords[0]][currentCoords[1] + 1],
  }

  const upWord = convertNumberToWord(surroundings.up);
  const downWord = convertNumberToWord(surroundings.down);
  const leftWord = convertNumberToWord(surroundings.left);
  const rightWord = convertNumberToWord(surroundings.right);

  return `Up: ${upWord}, Down: ${downWord}, Left: ${leftWord}, Right: ${rightWord}`;

}

function updateCoords(direction: string) {

  const up = [currentCoords[0] - 1, currentCoords[1]];
  const down = [currentCoords[0] + 1, currentCoords[1]];
  const left = [currentCoords[0], currentCoords[1] - 1];
  const right = [currentCoords[0], currentCoords[1] + 1];

  switch (direction) {
    case "move_up":
      if(map[up[0]][up[1]] !== 1){
        currentCoords = up;
      }
      break;
    case "move_down":
      if(map[down[0]][down[1]] !== 1){
        currentCoords = down;
      }
      break;
    case "move_left":
      if(map[left[0]][left[1]] !== 1){
        currentCoords = left;
      }
      break;
    case "move_right":
      if(map[right[0]][right[1]] !== 1){
        currentCoords = right;
      }
      break;
  }
}

function onStar() {
  return map[currentCoords[0]][currentCoords[1]] === 3;
}

function printMap(latest_action: string, frame: number) {
  console.clear();
  for (let i = 0; i < map.length; i++) {
    let line = "";
    for (let j = 0; j < map[i].length; j++) {
      if (currentCoords[0] === i && currentCoords[1] === j) {
        line += "O";
      } else {
        line += convertNumberToSymbol(map[i][j]);
      }
    }
    console.log(line);
  }
  console.log(`Action: ${latest_action}`);
  console.log(`Frame: ${frame}`);
}

const convertNumberToSymbol = (number: number) => {
  switch (number) {
    case 0:
      return " ";
    case 1:
      return "█";
    case 3:
      return "★";
    default:
      return "?";
  }
}

const convertNumberToWord = (number: number) => {
  switch (number) {
    case 0:
      return "empty space";
    case 1:
      return "wall";
    case 3:
      return "star";
    default:
      return "unknown";
  }
}


await runtime();
export { };

