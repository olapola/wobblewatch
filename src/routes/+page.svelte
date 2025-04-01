<script lang="ts">
    import { onMount } from "svelte";
    import dayjs from "dayjs";
    import { localStore } from "$lib/localstore.svelte";
    import { textMiddle, textNegative, textPositive } from "$lib/texts";
    import { defaultWobbleWatch, type Result, type WobbleWatch } from "$lib/types";
    import { slide } from "svelte/transition";
    import { flip } from "svelte/animate";

    import { writable } from "svelte/store"; //Ola la till

    let app = localStore<WobbleWatch>("wobble-watch", defaultWobbleWatch)
    let conclusion = $state<string>("Your destiny awaits!");
    let selectedResultIndex = $state<number>(-1);
    let timeoutSelected: number;
    let timeoutDelete: number;
    let deleteConfirmations = $state<number>(3);
    let timeoutGame: number;

    const requiredSamples = 3;
    const minDelay = 1;
    const maxDelay = 3;
    
    let beerLevel = writable(0); // Reactive store for beer level
    let beerPourInterval: number;  // for setInterval and clearInterval
    let updateInterval = 10 // ms

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
        timeoutGame = setTimeout(() => {
            return enterWaiting();
        }, delay * 1000);
    }

    function enterWaiting() {
        app.value.state = "waiting";
        app.value.begin = Date.now();
        
        beerLevel.set(0);
        
        let percentagePerUpdate = 50*updateInterval/smallestAvg

        // Start pouring beer (gradually increasing the beer level)
        beerPourInterval = setInterval(() => {
            beerLevel.update(currentLevel => {
                // Stop pouring if beer is full
                if (currentLevel < 100) {
                    return currentLevel + percentagePerUpdate;
                }
                clearInterval(beerPourInterval); // Stop pouring
                return currentLevel;
            });
        }, updateInterval); // Increase beer level every updateInterval ms
    }   

    function enterStopped() {
        if (app.value.state !== "waiting") {
            return enterError();
        }
        let end = Date.now();
        app.value.state = "stopped";
        app.value.times.push(end - app.value.begin);

        // Clear the beer pouring interval when the test is stopped
        clearInterval(beerPourInterval);  // Strange place to put this, but it works.

        if (app.value.times.length === requiredSamples) {
            return saveResults();
        }
        return enterCountdown();
    }

    function enterError() {
        app.value.state = "error";
        app.value.errors += 1;
        console.error("you clicked too early!");
        clearTimeout(timeoutGame);
        timeoutGame = setTimeout(() => {
            return enterCountdown();
        }, 1000);
    }

    function saveResults() {
        const avg = app.value.times.reduce((a, b) => a + b, 0) / app.value.times.length;
        let item: Result = {
            created: Date.now(),
            times: app.value.times,
            avg: avg,
            errors: app.value.errors,
            ingested: app.value.ingested,
        };

        // Use the calculated avg directly to update the beer level
        const percentagePerUpdateFinal = 50 * avg / smallestAvg; // Scale based on smallest average time
        beerLevel.set(Math.min(percentagePerUpdateFinal, 100)); 


        app.value.results = [ item, ...app.value.results ];
        conclusion = pickConclusion(avg);
        enterInitial();
    }

    function pickConclusion(avg: number): string {
        const rand: number = Math.random();
        if (avg < 600) {
            return textPositive[Math.floor(rand * textPositive.length)];
        }
        if (avg < 1200) {
            return textMiddle[Math.floor(rand * textMiddle.length)];
        }
        return textNegative[Math.floor(rand * textNegative.length)];
    }

    function selectResult(index: number) {
        if (timeoutSelected) {
            clearTimeout(timeoutSelected);
        }

        selectedResultIndex = index;
        timeoutSelected = setTimeout(() => {
            selectedResultIndex = -1;
        }, 2000);
    }

    function deleteResult(index: number) {
        app.value.results.splice(index, 1);
        selectResult(-1);
    }

    function deleteAllResults() {
        if (timeoutDelete) {
            clearTimeout(timeoutDelete);
        }

        timeoutDelete = setTimeout(() => {
            deleteConfirmations = 3;
        }, 2000);

        if (deleteConfirmations <= 0) {
            app.value.results = [];
        }

        deleteConfirmations--;
    }
    // Get the smallest average value from the results (if there are results). Not tested without result.
    let smallestAvg = Math.min(...app.value.results.map(r => r.avg || Infinity));

</script>

<div class="flex flex-col gap-2">
    <hgroup>
        <h1 class="h1">Wobble Watch</h1>
        <p>Test your reaction time and scientifically determine if you should get another beer!</p>
    </hgroup>

    <br>

    <p class="text-lg font-bold">How many beers have you had so far?</p>
    <div class="grid grid-cols-5 gap-2">
        {#each [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ] as o}
            <button onclick={() => app.value.ingested = o} class="btn btn-lg preset-outlined-surface-200-800" class:preset-filled-primary-500={app.value.ingested === o}>{o}</button>
        {/each}
    </div>

    <br>

    <!-- Beer glass -->
    <div class="beer-glass-container">
        <div class="beer-glass">
            <div class="sober-line-text">Sober</div>
            <div class="beer-half-line"></div>
            {#if app.value.state === "initial" && app.value.results.length > 0}
                <div class="last-average">
                <p class="text-center">Your result (average): {app.value.results[0].avg.toFixed(0)} ms</p>
                </div>
            {/if}
            <div class="foam"></div>
            <div class="beer-level" style="height: {$beerLevel}%"></div>
        </div>
    </div>
    <br>

        

    <h6 class="flex justify-between text-lg font-bold">
        <span>
            {#if app.value.state === "initial"}
                Press again when prompted
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
        <h3 class="text-center text-xl font-bold">{conclusion}</h3>
    </div>

    <br>

    <hgroup>
        <h4 class="text-lg font-bold">Your past results</h4>
        {#if app.value.results.length}
            <p>Completed experiments</p>
        {:else}
            <p>No results yet, press the button ☝️ to begin</p>
        {/if}
    </hgroup>

    {#if selectedResultIndex >= 0}
        <div class="flex gap-2" in:slide out:slide>
            <button type="button" class="basis-1/3 btn preset-outlined-error-500" onclick={() => deleteResult(selectedResultIndex)}>Delete result</button>
            <button type="button" class="basis-2/3 btn preset-outlined-primary-500" onclick={() => selectResult(-1)}>Never mind</button>
        </div>
    {/if}

    {#if app.value.results.length}
        <div class="table-wrap">
            <table class="table caption-bottom">
                <thead>
                <tr>
                    <th>Created</th>
                    <th>Ingested</th>
                    <th>Errors</th>
                    <th class="flex justify-end">Average</th>
                </tr>
                </thead>
                <tbody>
                {#each app.value.results as r, i (r.created)}
                    <tr class="cursor-pointer hover:preset-tonal" animate:flip class:preset-filled-error-500={i === selectedResultIndex} onclick={() => selectResult(i)}>
                        <td>
                            <span class="text-surface-600-400">{dayjs(r.created).format("DD/M")}</span>
                            <span>{dayjs(r.created).format("HH:mm:ss")}</span>
                        </td>
                        <td>
                            <span>{r.ingested}</span>
                            <span class="text-surface-600-400">beers</span>
                        </td>
                        <td>
                            <span class:text-surface-700-300={r.errors === 0}>{r.errors} goofs</span>
                        </td>
                        <td class="text-end">
                            <span>{r.avg.toFixed(0)}</span>
                            <span class="text-surface-600-400">ms</span>
                        </td>
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

    {#if deleteConfirmations < 3 && app.value.results.length}
        <p class="text-center text-error-500" in:slide out:slide>Press delete {deleteConfirmations + 1} more times</p>
    {/if}

    {#if app.value.results.length}
        <button onclick={() => deleteAllResults()} class="lowercase btn" class:preset-filled-error-500={deleteConfirmations < 3}>delete all results</button>
    {/if}
</div>

<div class="smallest-avg">
    {#if app.value.results.length > 0}
        <p class="text-center text-lg">Smallest Reaction Time: {smallestAvg.toFixed(0)} ms</p>
    {:else}
        <p class="text-center text-lg">No results yet</p>
    {/if}
</div>

<style lang="postcss">
    th {
        font-weight: bold;
    }

    td {
        font-family: monospace;
    }


.beer-glass-container {
  width: 120px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

/* The beer glass itself */
.beer-glass {
  width: 100px;
  height: 200px;
  border: 0 solid transparent;
  border-width: 0 5px 5px; /* top, sides, bottom */
  border-color: transparent #cccccc #cccccc; /* top, sides, bottom */
  border-radius: 5px;
  position: relative;
}

.sober-line-text {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translateX(-50%); /* Center the text horizontally */
  font-size: 12px;
  font-weight: bold;
  color: #333;
  z-index: 2;
  white-space: nowrap;
  max-width: 90%;
  text-align: center; /* Ensure text is centered within the container */
}

.beer-half-line {
  position: absolute;
  top: 40%; /* 60% here but 50% in calcuations... */
  left: 0;
  width: 100%;
  border-top: 2px dotted #333;
  z-index: 1;
}
/* Foam on top of the beer
.foam {
  width: 100px;
  height: 40px;
  border-radius: 20px;
  background-color: #ffffff;
  position: absolute;
  top: -20px;
  left: -5px;
}
*/

/* Last Average text inside the glass */
.last-average {
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  z-index: 3;
}


.beer-level {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: #f8e47b;
  transition: height 0.01s ease-in-out;
  height: 0%; /* This will change dynamically */
}

</style>