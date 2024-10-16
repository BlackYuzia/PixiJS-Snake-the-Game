import { Application, Assets, BitmapText, Container, Graphics, Sprite } from "pixi.js";
import { Game } from "./game";
import { BORDERS_SIZE, CEIL_SIZE, FIELD_PX, FIELD_SIZE } from "./const";
import { Food, FoodSpeed, FoodTeleport, FoodWall } from "./food";

export class Pixi {
    static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Who we are? Lazy!
    // When we lazy? Always!
    static async createSidebar(app: Application) {
        const texture = await Assets.load('sidebar.png');
        const sidebar = new Sprite(texture);
        sidebar.x = app.renderer.width - sidebar.width; // right
        app.stage.addChild(sidebar);
        return sidebar;
    }

    static createField(app: Application) {
        // +1 px (w & h) to fix display
        const field = new Graphics()
            .fill(0x575757)
            .rect(0, 0, FIELD_PX + 1, FIELD_PX + 1)
            .fill()
        field.x = BORDERS_SIZE;
        field.y = BORDERS_SIZE;
        app.stage.addChild(field);
        return field;
    }

    // There we should also make background, but we already has it on background so...
    static async createBitmapText(app: Application, options: {
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

    static async createButton(app: Application, options: {
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

    // We should provide whole game to allow change food class (type)
    static async createGameModsGUI(app: Application, state: Game["state"], gameModesIcons: Sprite[], sidebar: Sprite, game: Game) {
        const bg = new Sprite(await Assets.load('gamemodes_bg.png'));
        bg.x = sidebar.x;
        bg.y = 272;

        const gameModesNames = ["Classic", "No Die", "Walls", "Portal", "Speed"];
        const gameModesFood = [Food, Food, FoodWall, FoodTeleport, FoodSpeed];
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
                game.food.items.forEach(item => item.destroy())
                game.food = new gameModesFood[i]()
                await game.food.init(game.app)
            })

            gameModesIcons.push(icon)

        }

        app.stage.addChild(bg)

        return bg
    }

    static async createSnake(app: Application) {
        const segments: Sprite[] = [];
        const snake = new Container();
        const textureHead = await Assets.load("snake_head.png")
        const textureBody = await Assets.load("snake_body.png")

        for (let i = 0; i < 3; i++) {
            const segment = new Sprite(i < 1 ? textureHead : textureBody);
            segment.y = CEIL_SIZE * i;
            snake.addChild(segment)
            segments.push(segment);
        }

        snake.y = CEIL_SIZE * 10
        snake.x = CEIL_SIZE * 5

        app.stage.addChild(snake);

        return { snake, segments }
    }

    static async growSnake(snake: Container, segments: Sprite[]) {
        const textureBody = await Assets.load("snake_body.png");
        const segment = new Sprite(textureBody);
        const lastSegment = segments[segments.length - 1];

        snake.addChild(segment)
        segments.push(segment);

        segment.x = lastSegment.x;
        segment.y = lastSegment.y;
    }

    static async createFood(options: {
        x?: number;
        y?: number;
        visible: boolean,
    }) {
        const food = new Sprite(await Assets.load("food.png"));
        food.x = options.x || this.randomInt(1, FIELD_SIZE) * CEIL_SIZE
        food.y = options.y || this.randomInt(1, FIELD_SIZE) * CEIL_SIZE
        food.visible = options.visible;
        food.width = CEIL_SIZE;
        food.height = CEIL_SIZE;
        return food;
    }

    static createWalls() {
        const fill = 0xA96A0E
        const top = new Graphics()
            .fill(fill)
            .rect(0, 0, BORDERS_SIZE * 2 + CEIL_SIZE * 20, 32)
            .fill()
        const left = new Graphics()
            .fill(fill)
            .rect(0, 0, 32, BORDERS_SIZE * 2 + CEIL_SIZE * 20)
            .fill()
        // +1 px to fix AABB
        const right = new Graphics()
            .fill(fill)
            .rect(BORDERS_SIZE + CEIL_SIZE * 20 + 1, 0, 32, BORDERS_SIZE * 2 + CEIL_SIZE * 20) // Who stole my 4 px?
            .fill()
        // +1 px to fix AABB
        const bottom = new Graphics()
            .fill(fill)
            .rect(0, BORDERS_SIZE + CEIL_SIZE * 20 + 1, BORDERS_SIZE * 2 + CEIL_SIZE * 20, 32)
            .fill()
        return [top, left, right, bottom];
    }

    static createWall() {
        const fill = 0xA96A0E
        const wall = new Graphics()
            .fill(fill)
            .rect(this.randomInt(1, FIELD_SIZE) * CEIL_SIZE, this.randomInt(1, FIELD_SIZE) * CEIL_SIZE, BORDERS_SIZE, BORDERS_SIZE)
            .fill()
        return wall;
    }

    static testForAABB(object1: Sprite | Graphics, object2: Sprite | Graphics) {
        const bounds1 = object1.getBounds();
        const bounds2 = object2.getBounds();

        return (
            bounds1.x < bounds2.x + bounds2.width
            && bounds1.x + bounds1.width > bounds2.x
            && bounds1.y < bounds2.y + bounds2.height
            && bounds1.y + bounds1.height > bounds2.y
        );
    }
}
