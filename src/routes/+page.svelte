<script lang="ts">
    import { onMount } from "svelte";
    import dayjs from "dayjs";
    import { localStore } from "$lib/localstore.svelte";
    import { Accordion } from '@skeletonlabs/skeleton-svelte';

    let sm = $state<"initial" | "countdown" | "waiting" | "stopped" | "error">("initial");
    let times = $state<number[]>([]);
    let begin = $state(Date.now());
    let errors = $state(0);
    let timeout = $state(0);
    let ingested = $state(0);
    let results = localStore<any[]>("results", []);

    const faq = "It absolutely doesn't work!";
    const minDelay = 1;
    const maxDelay = 3;
    const samples = 3;

    onMount(() => {
        enterInitial();
    });

    function enterInitial() {
        sm = "initial";
        times = [];
        errors = 0;
    }

    function enterCountdown() {
        if (sm === "countdown") {
            return enterError();
        }

        sm = "countdown";
        const delay = Math.floor(Math.random() * maxDelay) + minDelay;
        timeout = setTimeout(() => {
            return enterWaiting();
        }, delay * 1000);
    }

    function enterWaiting() {
        sm = "waiting";
        begin = Date.now();
    }

    function enterStopped() {
        if (sm !== "waiting") {
            return enterError();
        }
        let end = Date.now();
        sm = "stopped";
        times.push(end - begin);

        if (times.length === samples) {
            return saveResults();
        }
        return enterCountdown();
    }

    function enterError() {
        sm = "error";
        errors += 1;
        console.error("you clicked too early!");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            return enterCountdown();
        }, 1000);
    }

    function saveResults() {
        results.value.push({
            created: Date.now(),
            times: times,
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            errors: errors,
            ingested: ingested,
        });
        enterInitial();
    }
</script>

<div class="flex flex-col gap-4">
    <hgroup>
        <h1 class="h1">Wobble Watch</h1>
        <p>Scientifically determine if you should get another beer!</p>
    </hgroup>

    <Accordion collapsible>
        <Accordion.Item value="club">
            <!-- Control -->
            {#snippet lead()}{/snippet}
            {#snippet control()}How does it work?{/snippet}
            <!-- Panel -->
            {#snippet panel()}{faq}{/snippet}
        </Accordion.Item>
    </Accordion>

    {#if sm === "initial"}
        <p>Push the start button and get ready!</p>
    {:else if sm === "countdown"}
        <p>Get ready!</p>
    {:else if sm === "waiting"}
        <p>Hurry up and click me!</p>
    {:else if sm === "error"}
        <p>Too early!</p>
    {/if}

    {#if sm === "initial"}
        <button type="button" onclick={enterCountdown} class="btn btn-lg preset-filled-primary-500">Press to begin</button>
    {:else if sm === "countdown" }
        <button type="button" onclick={enterError} class="btn btn-lg preset-tonal-primary animate-pulse">Get ready...</button>
    {:else if sm === "waiting"}
        <button type="button" onclick={enterStopped} class="btn uppercase font-bold btn-lg preset-filled-tertiary-500">Click me</button>
    {:else if sm === "error"}
        <button type="button" disabled class="btn btn-lg preset-filled-error-500">Too early!</button>
    {/if}

    <br>

    <hgroup>
        <h2 class="h2">Results</h2>
        <p>Results of your completed experiments</p>
    </hgroup>

    <div class="table-wrap">
        <table class="table caption-bottom">
            <caption class="pt-4">Previous measurements and statistics</caption>
            <thead>
            <tr>
                <th>Created</th>
                <th>Avg</th>
                <th>Errors</th>
                <th>Ingested</th>
            </tr>
            </thead>
            <tbody class="[&>tr]:hover:preset-tonal-primary">
            {#each results.value as r (r.created)}
                <tr>
                    <td>{dayjs(r.created).format("YY-MM-DD HH:MM.ss")}</td>
                    <td>{r.avg.toFixed(0)}</td>
                    <td>{r.errors}</td>
                    <td>{r.ingested}</td>
                </tr>
            {/each}
            </tbody>
            <tfoot>
            <tr>
                <td colspan="3">Total</td>
                <td class="text-right">{results.value.length} Results</td>
            </tr>
            </tfoot>
        </table>
    </div>
</div>
