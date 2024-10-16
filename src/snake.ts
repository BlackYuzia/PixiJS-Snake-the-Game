import { Application, Container, Sprite } from "pixi.js";
import { Pixi } from "./pixi";
import { Game } from "./game";
import { CEIL_SIZE } from "./const";

export class Snake {
    state: {
        segments: Sprite[],
        snake: null | Container,
    } = {
            segments: [] as Sprite[],
            snake: null,
        }

    move(state: Game["state"]) {
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
    async create(app: Application) {
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
        await Pixi.growSnake(this.state.snake!, this.state.segments);
    }
}