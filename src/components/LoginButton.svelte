<script lang="ts">
import Icon from "@iconify/svelte";
import type { AstroCookies } from "astro";
import { onMount } from "svelte";

export let accessToken: AstroCookies | undefined;
export let refreshToken: AstroCookies | undefined;

onMount(() => {});
</script>

<div>
    {#if accessToken && refreshToken}
    <button aria-label="Dashboard" name="Dashboard" class="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90" id="nav-dashboard"
        on:click={() => {
            window.location.href = "/dashboard";
        }}>
        <Icon icon="material-symbols:account-circle" class="text-[1.25rem]"></Icon>
    </button>
    {:else}
    <button aria-label="Log in" name="Log in" class="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90" id="nav-log-in"
        on:click={() => {
            window.location.href = "/signin";
        }}>
        <Icon icon="material-symbols:login-rounded" class="text-[1.25rem]"></Icon>
    </button>
    {/if}
</div>