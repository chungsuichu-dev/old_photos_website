<script lang="ts">
    import { goto } from '$app/navigation';

    let searchExpanded = $state(false);
    let query = $state('');
    let isLoading = $state(false);
    let errorMessage = $state<string | null>(null);

    let searchButtonEl: HTMLButtonElement | null = null;
    let searchY = $state(0);

    function toggleSearch() {
        if (searchButtonEl) {
            const rect = searchButtonEl.getBoundingClientRect();
            searchY = rect.top + window.scrollY;
        }
        searchExpanded = !searchExpanded;
    }

    async function performSearch() {
        isLoading = true;
        errorMessage = null;

        try {
            const res = await fetch(
                `https://app-still-snow-1787.fly.dev/search?query=${encodeURIComponent(query)}`
            );

            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                errorMessage = 'No matches found';
                return;
            }

            goto(`/search?query=${encodeURIComponent(query)}`);
        } catch (e) {
            errorMessage = 'Unable to connect to server.';
        } finally {
            isLoading = false;
        }
    }
</script>

<style>
    .page {
        min-height: 100vh;
        width: 100%;
        background-image: url('/wood_wall.jpeg');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .menu-container {
        margin-top: 10px;
        width: 100%;
        max-width: 600px;
        padding: 10px;
    }

    .row {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin-bottom: 8px;
    }

    button.menu-button {
        background: none;
        border: none;
        cursor: pointer;
        font-family: 'GoudyBookletter1911', serif;
        font-size: 34px;
        padding: 18px 24px;
        border-radius: 14px;
        user-select: none;
        text-align: center;
    }

    button.overlay {
        position: fixed;
        inset: 0;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: default;
    }

    .dropdown {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0 auto;
        max-width: 600px;
        background: #355e3b; 
        border-radius: 12px;
        padding: 16px;
        pointer-events: none;
        transform: translateY(-100%);
    }

    .dropdown-inner {
        pointer-events: auto;
    }

    .search-input {
        width: 100%;
        box-sizing: border-box;
        font-size: 26px;
        font-family: 'GoudyBookletter1911', serif;
        padding: 8px;
        background: #EEE8DF;
    }

    .search-submit {
        padding: 0px 20px;
        font-size: 26px;
        font-family: 'GoudyBookletter1911', serif;
        border-radius: 12px;
        border: 2px solid #000000dd;
        background: #EEE8DF;
        cursor: pointer;
    }


</style>

<div class="page">
    <div class="menu-container">

        <div class="row">
            <button class="menu-button" onclick={() => goto('/mission')}>Mission</button>
            <button class="menu-button" onclick={() => goto('/rules')}>Rules</button>
        </div>

        <div class="row">
            <button class="menu-button" onclick={() => goto('/faq')}>FAQs</button>
            <button class="menu-button" onclick={() => goto('/stories')}>Stories</button>
        </div>

        <div class="row">
            <button class="menu-button" onclick={() => goto('/upload')}>📤 Upload Photos</button>
        </div>

        <div class="row">
            <button
                class="menu-button"
                bind:this={searchButtonEl}
                onclick={toggleSearch}
            >
                🔍 Search Photos
            </button>
        </div>

        <div class="row">
            <button
                class="menu-button"
                onclick={() => (window.location.href = 'mailto:oldphotosconnect@gmail.com')}
            >
                Email
            </button>
            <button class="menu-button" onclick={() => goto('/donate')}>Donate</button>
        </div>
    </div>

    {#if searchExpanded}
        <button
            class="overlay"
            aria-label="Close search dropdown"
            onclick={() => (searchExpanded = false)}
        ></button>
    {/if}

    {#if searchExpanded}
        <div class="dropdown" style="top: {searchY}px;">
            <div class="dropdown-inner">
                <input
                    type="text"
                    placeholder="Search by clues"
                    bind:value={query}
                    class="search-input"
                />

                <div style="font-family: 'GoudyBookletter1911'; font-size: 20px; margin-top: 6px;">
                    *What, where, when<br>*Leave blank to see all
                </div>

                {#if isLoading}
                    <div style="margin-top: 12px;">Loading…</div>
                {/if}

                {#if errorMessage}
                    <div style="color: red; margin-top: 12px; font-size: 24px;">
                        {errorMessage}
                    </div>
                {/if}

                <div style="text-align: center; margin-top: 16px;">
                    <button class="search-submit" onclick={performSearch}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    {/if}

</div>
