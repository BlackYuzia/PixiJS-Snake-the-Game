import { Application, Sprite } from "pixi.js";
import { Pixi } from "./pixi";
import { CEIL_SIZE, FIELD_SIZE } from "./const";
import { Game } from "./game";

export class Food {
    items

    constructor() {
        this.items = null;
    }

    async init(app) {
        this.items = [await Pixi.createFood({
            visible: false,
        })]

        app.stage.addChild(...this.items)
    }

    // todo: rename to respawn?
    create() {
        for (const item of this.items) {
            item.visible = true;
            item.x = Pixi.randomInt(1, FIELD_SIZE) * CEIL_SIZE
            item.y = Pixi.randomInt(1, FIELD_SIZE) * CEIL_SIZE
        }
    }

    destroy() {
        for (const item of this.items) {
            item.visible = false;
        }
    }

    eat(game) {
        game.snake.growUp()
        this.create()
    }
}

export class FoodWall extends Food {
    eat(game) {
        super.eat()
        super.create()
        const wall = Pixi.createWall();
        game.app.stage.addChild(wall)
        game.walls.push(wall)
    }
}

export class FoodTeleport extends Food {
    constructor() {
        super()
    }

    async init(app) {
        // todo: use Promise.All instead
        this.items = [
            await Pixi.createFood({
                visible: false,
            }),
            await Pixi.createFood({
                visible: false,
            }),
        ];

        app.stage.addChild(...this.items)
    }

    eat(game) {
        const teleportTo = Pixi.testForAABB(game.snake.state.segments[0], this.items[0]) ? this.items[1] : this.items[0];
        // Recalculate local (relative?) position and apply to head only
        const { x, y, } = game.snake.state.segments[0].toLocal(teleportTo);
        game.snake.state.segments[0].x += x
        game.snake.state.segments[0].y += y
        super.eat()
        super.create()
    }
}

export class FoodSpeed extends Food {
    eat(game) {
        super.eat()
        super.create()
        // Speed up on 10%
        game.app.ticker.maxFPS += game.app.ticker.maxFPS * 0.1
        game.app.ticker.minFPS += game.app.ticker.minFPS * 0.1
    }
}