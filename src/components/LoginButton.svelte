<script lang="ts">
import Icon from "@iconify/svelte";
import type { AstroCookies } from "astro";
import { onMount } from "svelte";

export let accessToken: AstroCookies | undefined;
export let refreshToken: AstroCookies | undefined;
let isLoggedIn = accessToken && refreshToken;

onMount(() => {});
</script>

<div>
    <button aria-label={isLoggedIn ? "Dashboard" : "Log in"}
            name={isLoggedIn ? "Dashboard" : "Log in"}
            class="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90"
            id={isLoggedIn ? "nav-dashboard" : "nav-log-in"}
        on:click={() => {
            window.location.href = isLoggedIn ? "/dashboard" : "/signin";
        }}>
        <Icon icon={isLoggedIn ? "material-symbols:account-circle" : "material-symbols:login-rounded"} class="text-[1.25rem]"></Icon>
    </button>
</div>