<script lang="ts">
    import { onMount } from "svelte";
    import dayjs from "dayjs";
    import { localStore } from "$lib/localstore.svelte";

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

    let app = localStore<WobbleWatch>("wobblewatch", defaultValue)
    let timeout: number;

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
        app.value.results.push({
            created: Date.now(),
            times: app.value.times,
            avg: app.value.times.reduce((a, b) => a + b, 0) / app.value.times.length,
            errors: app.value.errors,
            ingested: app.value.ingested,
        });
        enterInitial();
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
                Start and press when prompted
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

    <hgroup>
        <h2 class="h2">Results</h2>
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
                            <span>{dayjs(r.created).format("HH:MM:ss")}</span>
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
