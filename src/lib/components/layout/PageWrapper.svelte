<script lang="ts">
    let { title, desc, children } = $props();
</script>

<div>
    <hgroup>
        <h2 class="h2">{title}</h2>
        <p>{desc}</p>
    </hgroup>
    <br>
    {@render children()}
</div>
