interface Entry {
    created: number;
    errors: number;
    beers: number;
    times: number[];
}

class WobbleWatch {
    private interval = $state<number>(0);
    private times: number[] = [];
    private entries: Entry[] = [];

    public beerHeight = $state<number>(0);
    public running = $state<boolean>(false);
    public beerCount: number = -1;

    constructor() {
        this.beerHeight = 0;
        this.beerCount = -1;
        this.running = false;
        this.times = [];
        this.entries = [];
        clearInterval(this.interval);
    }

    start() {
        if (this.running) {
            console.error("already running");
            return;
        }

        if (this.beerCount === -1) {
            console.error("beer count not set");
            return;
        }

        const el = document.getElementById('beer');
        if (!el) {
            console.error("beer element not found");
            this.running = false;
            return;
        }

        this.beerHeight = el.clientHeight;
        console.log("initial beer height", this.beerHeight);

        this.running = true;
        this.registerTime();

        this.interval = setInterval(() => {
            if (this.beerHeight >= 300) {
                clearInterval(this.beerHeight);
                this.running = false;
                return;
            }

            this.beerHeight++;
            el.style.height = `${this.beerHeight}px`;

            console.log("current beer height", this.beerHeight);
        }, 10)
    }

    registerTime() {
        this.times.push(Date.now());
    }

    stop() {
        clearInterval(this.interval);
        this.registerTime();
        this.running = false;
    }
}

export const app = new WobbleWatch();
