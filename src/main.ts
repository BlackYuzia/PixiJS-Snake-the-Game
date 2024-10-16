import './style.css'
import { Application, Sprite, Assets, Graphics, BitmapText, Container } from 'pixi.js';

const app = new Application();

// @ts-expect-error
// add debug
globalThis.__PIXI_APP__ = app;
await app.init({
  width: 999,
  height: 700,
  eventMode: "auto",
});
document.querySelector("#app")!.appendChild(app.canvas);

const state = {
  modes: {
    classic: true,
    noDie: false,
    walls: false,
    portal: false,
    speed: false,
  },
  playing: false,
  direction: {
    x: 0,
    y: -1
  }
}

await createBackground();
createText({
  text: "Best :",
  x: 709,
  y: 135,
})

createText({
  text: "Score :",
  x: 709,
  y: 210,
})

const [
  best,
  score,
  playBtn,
  exitBtn,
  menuBtn,
] = await Promise.all([
  createText({
    text: "0",
    x: 897,
    y: 135,
  }),
  createText({
    text: "0",
    x: 897,
    y: 210,
  }),
  createButton({
    onClick: togglePlay,
    x: 723,
    y: 589,
    path: "play.png"
  }),
  createButton({
    onClick: togglePlay,
    x: 863,
    y: 589,
    path: "exit.png"
  }),
  createButton({
    onClick: togglePlay,
    x: 792,
    y: 589,
    path: "menu.png",
    hidden: true, //
  }),
])

async function createFood(options: {
  x: number;
  y: number;
  size: number;
  color: string | number;
}) {
  const food = new Graphics().fill(options.color).rect(options.x, options.y, options.size, options.size);
  return food;
}

// Who we are? Lazy!
// When we lazy? Always!
async function createBackground() {
  const texture = await Assets.load('background.png');
  const background = new Sprite(texture);
  background.x = app.renderer.width / 2;
  background.y = app.renderer.height / 2;
  background.anchor.x = 0.5;
  background.anchor.y = 0.5;
  app.stage.addChild(background);
  // do not return any, cuz we won't change background any more
}

async function createButton(options: {
  x: number, y: number,
  onClick: () => void,
  path: string,
  hidden?: boolean,
}) {
  // Who we are? 
  const button = new Sprite(await Assets.load(options.path))

  button.x = options.x;
  button.y = options.y;

  button.eventMode = "static";
  button.on("pointertap", options.onClick);
  button.cursor = "pointer"

  app.stage.addChild(button)

  button.visible = !options.hidden;

  return button;
}

// There we should also make background, but we already has it on background so...
async function createText(options: {
  text: string;
  x: number;
  y: number;
}) {
  const text = new BitmapText({
    text: options.text,
    x: options.x,
    y: options.y,
  })
  app.stage.addChild(text)
  return text;
}
bindKeys()
function bindKeys() {
  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'ArrowUp':
        state.direction = { x: 0, y: -1 }
        break;
      case 'ArrowDown':
        state.direction = { x: 0, y: 1 }
        break;
      case 'ArrowLeft':
        state.direction = { x: -1, y: 0 }
        break;
      case 'ArrowRight':
        state.direction = { x: 1, y: 0 }
        break;
      // Restart
      case 'KeyR':
      // Pause
      case 'KeyP':
        break;
      // Stop
      case 'Escape':
        break;
    }
  });
}

// We change only icons, so instead of push group we push icons only. We could change it in future if we want
const gameModesIcons: Sprite[] = [];
async function createGameMods() {
  const bg = new Sprite(await Assets.load('gamemodes_bg.png'));
  bg.x = 699;
  bg.y = 272;

  const gameModesNames = ["Classic", "No Die", "Walls", "Portal", "Speed"];
  const gameModesValues = Object.values(state.modes);
  const gameModesKeys = Object.keys(state.modes) as (keyof typeof state.modes)[];
  // create checkboxes
  for (let i = 0; i < gameModesValues.length; i++) {
    const group = new Container({})
    const icon = new Sprite(await Assets.load(gameModesValues[i] ? "checkbox_on.png" : "checkbox_off.png"))
    const label = new BitmapText({
      text: gameModesNames[i]
    })
    group.addChild(icon, label)
    bg.addChild(group)

    label.x = 75

    group.y = 50 * i + 10;
    group.x = 20

    group.eventMode = "static"
    group.on("pointertap", async () => {
      // Reset other modes
      for (let k = 0; k < gameModesKeys.length; k++) {
        if (k === i) continue; // skip current mode
        state.modes[gameModesKeys[k]] = false;
        gameModesIcons[k].texture = await Assets.load("checkbox_off.png")
      }
      state.modes[gameModesKeys[i]] = true;
      icon.texture = await Assets.load("checkbox_on.png")
    })

    gameModesIcons.push(icon)

  }

  app.stage.addChild(bg)

  return bg
}

await createGameMods()


function togglePlay() {
  state.playing = !state.playing;

  playBtn.visible = !state.playing
  exitBtn.visible = !state.playing
  menuBtn.visible = state.playing
}
const snake = await createSnake()
async function createSnake() {
  let snake: Container;
  const segments: Sprite[] = [];
  await respawn();
  function destroy() {
    snake?.destroy({ children: true })
  }
  async function respawn() {
    snake = new Container();
    const textureHead = await Assets.load("snake_head.png")
    const textureBody = await Assets.load("snake_body.png")
    for (let i = 0; i < 3; i++) {
      const segment = new Sprite(i < 1 ? textureHead : textureBody);
      segment.y = 33 * i;
      snake.addChild(segment)
      segments.push(segment);
    }
    snake.y = 633 - 33 * 3
    snake.x = 33 * 10
    app.stage.addChild(snake);
  }
  function growUp() { }
  function move() {
    const head = segments[0];
    const prev = segments.map(({ x, y }) => ({ x, y }))
    head.x += state.direction.x * 33
    head.y += state.direction.y * 33

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const coord = prev[i - 1];
      segment.x = coord.x;
      segment.y = coord.y;
    }
  }

  return {
    destroy,
    growUp,
    move,
    respawn,
  }
}

app.ticker.maxFPS = 1;
app.ticker.add(() => {
  if (state.playing) {
    snake.move()
  }
});