<script lang="ts">
    import { onMount } from "svelte";
    import dayjs from "dayjs";
    import { localStore } from "$lib/localstore.svelte";

    const positive = [
        "Absolutely! The universe is clearly signaling 'another round!'",
        "Yes, without a doubt! Your beer senses are tingling for a reason.",
        "Go forth and beer! It's practically your destiny.",
        "Without question, your next beer awaits! Embrace the frothy goodness.",
        "A resounding YES! Your beer-getting skills are in high demand.",
        "The answer is a clear and enthusiastic 'beer, please!'",
        "Oh, without a shadow of a doubt, another beer is the only logical choice.",
        "Yes, yes, and yes! The beer gods have spoken.",
        "Indubitably! Your beer glass is practically begging for a refill.",
        "Affirmative! Your internal beer compass is pointing directly to the fridge.",
        "Without hesitation, another beer is in order! You've earned it.",
        "Yes, of course! Who could possibly deny you another beer?",
    ];

    const middle = [
        "You've clearly mastered the art of beer enjoyment! Perhaps savor this moment before another?",
        "Your enthusiasm is admirable! Maybe a brief pause to appreciate the current brew?",
        "A fine choice indeed! Consider a moment of reflection before diving into the next.",
        "The beer flows strong with you! Perhaps a small interlude to maintain balance?",
        "Your beer prowess is undeniable! A short, strategic pause might be wise.",
        "Excellent selection! Reflect on the current beer's glory before the next quest.",
        "Your beer journey is legendary! A moment of respite could enhance the experience.",
        "Such dedication to beer! A brief pause could make the next one even more delightful.",
        "A true connoisseur! Consider the current beer's nuances before seeking another.",
        "Your beer wisdom shines! A short interval could amplify your appreciation.",
    ];

    const negative = [
        "You've had a wonderful time! Let's hold onto that feeling and call it a great night.",
        "Perfectly enjoyed! Let's savor the satisfaction and leave it at that.",
        "That was a fantastic round! Perhaps we should conclude on a high note?",
        "You've reached a delightful level of enjoyment! Let's maintain that perfect balance.",
        "A truly excellent experience! It's best to appreciate the peak and stop there.",
        "You've had a great run! Let's finish strong and hold onto the good vibes.",
        "That was a perfect amount of enjoyment! Let's cherish it and end on a good note.",
        "A wonderful time, indeed! Let's preserve this excellent feeling for later.",
        "You've enjoyed your fill! Let's relish the moment and avoid overdoing it.",
        "That was a truly satisfying experience! Let's cap it off and keep it memorable.",
    ];

    interface Result {
        created: number;
        times: number[];
        avg: number;
        errors: number;
        ingested: number;
    }

    interface WobbleWatch {
        state: "initial" | "countdown" | "waiting" | "stopped" | "error";
        times: number[];
        begin: number;
        errors: number;
        ingested: number;
        results: Result[];
    }

    const defaultValue: WobbleWatch = {
        state: "initial",
        times: [],
        begin: Date.now(),
        errors: 0,
        ingested: 0,
        results: [],
    };

    let app = localStore<WobbleWatch>("wobble-watch", defaultValue)
    let timeout: number;
    let conclusion: string = "Your destiny awaits!";

    const requiredSamples = 3;
    const minDelay = 1;
    const maxDelay = 3;

    onMount(() => {
        enterInitial();
    });

    function enterInitial() {
        app.value.state = "initial";
        app.value.times = [];
        app.value.errors = 0;
    }

    function enterCountdown() {
        if (app.value.state === "countdown") {
            return enterError();
        }

        app.value.state = "countdown";
        const delay = Math.floor(Math.random() * maxDelay) + minDelay;
        timeout = setTimeout(() => {
            return enterWaiting();
        }, delay * 1000);
    }

    function enterWaiting() {
        app.value.state = "waiting";
        app.value.begin = Date.now();
    }

    function enterStopped() {
        if (app.value.state !== "waiting") {
            return enterError();
        }
        let end = Date.now();
        app.value.state = "stopped";
        app.value.times.push(end - app.value.begin);

        if (app.value.times.length === requiredSamples) {
            return saveResults();
        }
        return enterCountdown();
    }

    function enterError() {
        app.value.state = "error";
        app.value.errors += 1;
        console.error("you clicked too early!");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            return enterCountdown();
        }, 1000);
    }

    function saveResults() {
        const avg = app.value.times.reduce((a, b) => a + b, 0) / app.value.times.length;
        app.value.results.push({
            created: Date.now(),
            times: app.value.times,
            avg: avg,
            errors: app.value.errors,
            ingested: app.value.ingested,
        });
        conclusion = pickConclusion(avg);
        enterInitial();
    }

    function pickConclusion(avg: number): string {
        const rand: number = Math.random();
        if (avg < 500) {
            return positive[Math.floor(rand * negative.length)];
        }
        if (avg < 1500) {
            return middle[Math.floor(rand * middle.length)];
        }
        return negative[Math.floor(rand * positive.length)];
    }
</script>

<div class="flex flex-col gap-2">
    <hgroup>
        <h1 class="h1">Wobble Watch</h1>
        <p>Test your reaction time and scientifically determine if you should get another beer!</p>
    </hgroup>

    <br>

    <h6 class="h6">How many beers have you had so far?</h6>
    <div class="grid grid-cols-5 gap-2">
        {#each [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ] as o}
            <button onclick={() => app.value.ingested = o} class="btn btn-lg preset-outlined-surface-200-800" class:preset-filled-primary-500={app.value.ingested === o}>{o}</button>
        {/each}
    </div>

    <br>

    <h6 class="flex justify-between h6">
        <span>
            {#if app.value.state === "initial"}
                Start and press again when prompted
            {:else if app.value.state === "countdown"}
                Get ready!
            {:else if app.value.state === "waiting"}
                Hurry up and click me!
            {:else if app.value.state === "error"}
                Too early!
            {/if}
        </span>
        <span>
            ({app.value.times.length}/{requiredSamples})
        </span>
    </h6>

    {#if app.value.state === "initial"}
        <button type="button" onclick={enterCountdown} class="btn btn-lg preset-filled-primary-500">Press to begin</button>
    {:else if app.value.state === "countdown" }
        <button type="button" onclick={enterError} class="btn btn-lg preset-outlined-primary-500">Get ready...</button>
    {:else if app.value.state === "waiting"}
        <button type="button" onclick={enterStopped} class="uppercase btn btn-lg preset-filled-tertiary-500">Click me now</button>
    {:else if app.value.state === "error"}
        <button type="button" class="uppercase btn btn-lg preset-filled-error-500">Too early</button>
    {/if}

    <br>

    <div class="flex flex-col items-center">
        <p class="text-surface-600-400">Another round?</p>
        <h3 class="text-center h3">{conclusion}</h3>
    </div>

    <br>

    <hgroup>
        <h4 class="h4">Results</h4>
        {#if app.value.results.length}
            <p>Completed experiments</p>
        {:else}
            <p>No results yet, press the button ☝️ to begin</p>
        {/if}
    </hgroup>

    {#if app.value.results.length}
        <div class="table-wrap">
            <table class="table caption-bottom">
                <thead>
                <tr>
                    <th>Created</th>
                    <th>Ingested</th>
                    <th>Errors</th>
                    <th class="flex justify-end">Avg</th>
                </tr>
                </thead>
                <tbody>
                {#each app.value.results as r (r.created)}
                    <tr class="hover:preset-tonal">
                        <td>
                            <span class="text-surface-600-400">{dayjs(r.created).format("M/DD")}</span>
                            <span>{dayjs(r.created).format("HH:mm:ss")}</span>
                        </td>
                        <td>{r.ingested} <span class="text-surface-600-400">beers</span></td>
                        <td>
                            <span class:text-surface-700-300={r.errors === 0}>{r.errors}</span>
                            <span class="text-surface-600-400">goofs</span>
                        </td>
                        <td class="text-end font-mono">{r.avg.toFixed(0)} <span class="text-surface-600-400">ms</span></td>
                    </tr>
                {/each}
                </tbody>
                <tfoot>
                <tr>
                    <td colspan="3">Total</td>
                    <td class="text-right">{app.value.results.length} Results</td>
                </tr>
                </tfoot>
            </table>
        </div>
    {/if}

    <br>

    {#if app.value.results.length}
        <button onclick={() => app.value.results = []} class="lowercase btn">Delete Results</button>
    {/if}
</div>

<style lang="postcss">
    th {
        font-weight: bold;
    }

    td {
        font-family: monospace;
    }
</style>
