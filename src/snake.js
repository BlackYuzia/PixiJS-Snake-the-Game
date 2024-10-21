import { Application, Container, Sprite } from "pixi.js";
import { Pixi } from "./pixi";
import { Game } from "./game";
import { CEIL_SIZE } from "./const";

export class Snake {
    /**
    * @type {{segments: Sprite[],        snake: null | Container}}
    */
    state = {
        segments: [],
        snake: null,
    }

    /**
     * @argument {Game["state"]} state
     */
    move(state) {
        const head = this.state.segments[0];
        const prev = this.state.segments.map(({ x, y }) => ({ x, y }))
        head.x += state.direction.x * CEIL_SIZE
        head.y += state.direction.y * CEIL_SIZE

        for (let i = 1; i < this.state.segments.length; i++) {
            const segment = this.state.segments[i];
            const coord = prev[i - 1];
            segment.x = coord.x;
            segment.y = coord.y;
        }
    }
    /**
     * @argument {Application} app
     */
    async create(app) {
        const state = await Pixi.createSnake(app)
        this.state.segments = state.segments;
        this.state.snake = state.snake;
    }
    destory() {
        this.state.snake?.destroy({ children: true })
        this.state.snake = null;
        this.state.segments.length = 0;
    }
    async growUp() {
        await Pixi.growSnake(this.state.snake, this.state.segments);
    }
}