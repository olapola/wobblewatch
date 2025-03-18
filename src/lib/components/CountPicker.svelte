<script lang="ts">
    import { app } from "$lib/state/app.svelte";

    let { onselect } = $props();

    const options = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

    let selected = $state(-1);

    function onPick(option: number) {
        selected = option;
        onselect(option);
    }
</script>

<label class="label">
    <span class="label-text">How many beers have you had so far?</span>
    <select class="select" bind:value={app.beerCount}>
        {#each options as o}
            <option value={o}>{o}</option>
        {/each}
    </select>
</label>

