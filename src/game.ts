import { Application, BitmapText, Graphics, Sprite } from "pixi.js";
import { Pixi } from "./pixi";
import { Snake } from "./snake";
import { Food } from "./food";

export class Game {
    readonly app = new Application()
    readonly snake = new Snake()
    food = new Food()
    readonly walls: Graphics[] = [];
    private readonly state = {
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
        },
        score: 0,
        best: 0,
    }
    private readonly gui = {
        modeSelect: {} as Sprite,
        playBtn: {} as Sprite,
        exitBtn: {} as Sprite,
        menuBtn: {} as Sprite,
        best: {} as BitmapText,
        score: {} as BitmapText,
    }
    // We change only icons, so instead of store groups we store icons only. We could change it in future if we want
    private readonly gameModesIcons: Sprite[] = []

    public async init() {
        await this.app.init({
            width: 1000 + 32 * 2,
            height: 700 + 32 * 2,
            eventMode: "auto",
            background: 0x077482
        });
        document.querySelector("#app")!.appendChild(this.app.canvas);
        // @ts-expect-error
        globalThis.__PIXI_APP__ = this.app;

        // Init others
        await this.initGUI()
        this.initKeys()
        await this.food.init(this.app)
        this.initWalls()
    }

    private async initGUI() {
        // Wait background first
        const sidebar = await Pixi.createSidebar(this.app);
        Pixi.createField(this.app);
        const [,
            best, ,
            score,
            modeSelect,
            playBtn,
            exitBtn,
            menuBtn,
        ] =
            // Use promise all to consume less time
            await Promise.all([
                // Best
                Pixi.createBitmapText(this.app, {
                    text: "Best :",
                    x: sidebar.x + 13,
                    y: 135,
                }),
                Pixi.createBitmapText(this.app, {
                    text: "0",
                    x: sidebar.x + 200,
                    y: 135,
                }),
                // Score
                Pixi.createBitmapText(this.app, {
                    text: "Score :",
                    x: sidebar.x + 13,
                    y: 210,
                }),
                Pixi.createBitmapText(this.app, {
                    text: "0",
                    x: sidebar.x + 200,
                    y: 210,
                }),
                Pixi.createGameModsGUI(this.app, this.state, this.gameModesIcons, sidebar, this),
                Pixi.createButton(this.app, {
                    onClick: this.togglePlay.bind(this),
                    x: sidebar.x + 28,
                    y: sidebar.height - 46,
                    path: "play.png"
                }),
                Pixi.createButton(this.app, {
                    onClick: () => confirm("Exit from game? (WIP)"),
                    x: sidebar.x + 160,
                    y: sidebar.height - 46,
                    path: "exit.png"
                }),
                Pixi.createButton(this.app, {
                    onClick: this.togglePlay.bind(this),
                    x: sidebar.x + sidebar.width / 2 - 142 / 2,
                    y: sidebar.height - 46,
                    path: "menu.png",
                    hidden: true, // hidden if state is not playing
                }),
            ]);
        this.gui.modeSelect = modeSelect;
        this.gui.playBtn = playBtn;
        this.gui.exitBtn = exitBtn;
        this.gui.menuBtn = menuBtn;
        this.gui.best = best;
        this.gui.score = score;
    }

    private initKeys() {
        window.addEventListener('keydown', (e) => {
            if (!this.state.playing) {
                return;
            }

            // todo: prevent gameOver due break the neck / head via navigation
            switch (e.code) {
                case 'ArrowUp':
                    this.state.direction = { x: 0, y: -1 }
                    break;
                case 'ArrowDown':
                    this.state.direction = { x: 0, y: 1 }
                    break;
                case 'ArrowLeft':
                    this.state.direction = { x: -1, y: 0 }
                    break;
                case 'ArrowRight':
                    this.state.direction = { x: 1, y: 0 }
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

    private initWalls() {
        const walls = Pixi.createWalls();
        this.walls.push(...walls);
        this.app.stage.addChild(...walls)
    }

    private async togglePlay() {
        this.state.playing = !this.state.playing;
        // Show / hide buttons
        this.gui.playBtn.visible = !this.state.playing
        this.gui.exitBtn.visible = !this.state.playing
        this.gui.menuBtn.visible = this.state.playing
        this.gui.modeSelect.visible = !this.state.playing
        // Reset 
        this.updateScore(0)
        this.state.direction.x = 0
        this.state.direction.y = -1
        this.walls.slice(4).forEach(wall => wall.destroy())
        this.walls.length = 4;
        // Start or stop game
        this.app.ticker.maxFPS = 1;
        //        this.app.ticker.minFPS = 1;

        if (this.state.playing) {
            await this.snake.create(this.app)
            this.food.create()
            this.app.ticker.add(this.getRunner());
            return;
        }

        // Just for sure :3
        this.app.ticker.remove(this.getRunner())
        this.snake.destory()
        this.food.destroy()
    }

    public updateScore(score: number) {
        this.state.score = score;
        this.gui.score.text = this.state.score.toString()
        // Update best score
        if (score > this.state.best) {
            this.state.best = this.state.score
            this.gui.best.text = this.state.best.toString()
        }
    }

    private foodAABB() {
        // ~~head & foot compare~~ Compare each segment instead, to prevent stuck food in body
        for (const segment of this.snake.state.segments) {
            const eat = this.food.items.some(food => Pixi.testForAABB(segment, food));
            if (eat) {
                // Food choose what to do next
                this.food.eat(this)
                this.updateScore(this.state.score + 10);
            }
        }
    }

    private bodyAABB() {
        // Compare head and each segment
        const gameOver = this.snake.state.segments.slice(1).some(segment => Pixi.testForAABB(this.snake.state.segments[0], segment))
        if (gameOver) {
            this.togglePlay()
        }
    }

    private wallsAABB() {
        // Compare head and each wall
        const gameOver = this.walls.some(wall => Pixi.testForAABB(this.snake.state.segments[0], wall))
        if (gameOver) {
            this.togglePlay()
        }
    }

    private readonly runners = [
        // Default
        () => {
            this.foodAABB()
            this.wallsAABB()
            this.bodyAABB()
            if (this.state.playing) {
                this.snake.move(this.state)
                return;
            }
            // Remove handler to prevent memory leak
            this.app.ticker.remove(this.runners[0])
        },
        // No Die
        () => {
            this.foodAABB()
            if (this.state.playing) {
                this.snake.move(this.state)
                return;
            }
            // Remove handler to prevent memory leak
            this.app.ticker.remove(this.runners[0])
        },
    ]
    private getRunner() {
        if (this.state.modes.noDie) {
            return this.runners[1]
        }
        // Default
        return this.runners[0]
    }
}