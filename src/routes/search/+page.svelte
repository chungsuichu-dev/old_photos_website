<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    type SearchPhoto = {
        id: number;
        filename: string;
        caption: string;
        url: string;
    };

    let results = $state<SearchPhoto[]>([]);
    let total = $state(0);
    let message = $state<string | null>(null);
    let isLoading = $state(true);
    let currentIndex = $state(0);
    let pageInput = $state('1');
    let dragStartX = $state<number | null>(null);
    let dragStartY = $state<number | null>(null);
    let dragOffset = $state(0);
    let isDragging = $state(false);
    let showDeleteModal = $state(false);
    let deleteId = $state<number | null>(null);

    const maxTugRatio = 0.15;
    const edgeTugPx = 6;        
    const minDistanceRatio = 0.10;
    const cancelDistanceRatio = 0.05;
    const maxAngleDegrees = 22;

    function hasPhoto(): boolean {
        return results.length > 0 && currentIndex >= 0 && currentIndex < results.length;
    }

    function getPhoto(): SearchPhoto {
        return results[currentIndex];
    }

    async function loadResults(query: string, indexParam: string | null) {
        isLoading = true;
        results = [];
        total = 0;
        message = null;

        try {
            const res = await fetch(
                `https://app-still-snow-1787.fly.dev/search?query=${encodeURIComponent(query)}`
            );
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                results = [];
                total = 0;
                message = 'No matches found.';
            } else {
                results = data.results;
                total = data.total ?? data.results.length;
                message = data.message ?? null;

                let idx = 0;
                if (indexParam) {
                    const parsed = parseInt(indexParam, 10);
                    if (!Number.isNaN(parsed)) {
                        idx = Math.min(Math.max(parsed, 0), results.length - 1);
                    }
                }
                currentIndex = idx;
                pageInput = String(currentIndex + 1);
            }
        } catch {
            message = 'Unable to connect to server.';
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        const unsubscribe = page.subscribe(($page) => {
            const q = $page.url.searchParams.get('query') ?? '';
            const indexParam = $page.url.searchParams.get('index');
            loadResults(q, indexParam);
        });

        const handleResize = () => {
            dragOffset = 0;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            unsubscribe();
            window.removeEventListener('resize', handleResize);
        };
    });

    function goToPage() {
        const input = parseInt(pageInput, 10);
        if (Number.isNaN(input)) return;
        if (input < 1 || input > total) return;
        currentIndex = input - 1;
        dragOffset = 0;
    }

    async function deletePhoto(id: number) {
        try {
            const res = await fetch(`https://app-still-snow-1787.fly.dev/photos/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                await goto('/');
            } else {
                console.error('Failed to delete photo', await res.text());
            }
        } catch (e) {
            console.error('Error deleting photo', e);
        }
    }

    function handlePointerDown(event: PointerEvent) {
        if (!hasPhoto()) return;
        isDragging = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragOffset = 0;
    }

    function handlePointerMove(event: PointerEvent, container: HTMLDivElement | null) {
        if (!isDragging || dragStartX === null || dragStartY === null || !container) return;

        const dx = event.clientX - dragStartX;
        console.log("dx:", dx);
        const dy = event.clientY - dragStartY;

        const width = container.clientWidth || window.innerWidth;
        const maxTug = width * maxTugRatio;

        let tug = Math.max(Math.min(dx, maxTug), -maxTug);

        const atFirst = currentIndex === 0;
        const atLast = currentIndex >= total - 1;

        if ((dx < 0 && atLast) || (dx > 0 && atFirst)) {
            tug = Math.max(Math.min(dx, edgeTugPx), -edgeTugPx);
        }

        const angleRadians = dx === 0 ? Math.PI / 2 : Math.atan(dy / dx);
        const angleDegrees = Math.abs((angleRadians * 180) / Math.PI);
        if (angleDegrees > maxAngleDegrees) {
            dragOffset = 0;
            return;
        }

        dragOffset = tug;
    }

    function handlePointerUp(event: PointerEvent, container: HTMLDivElement | null) {
        if (!isDragging || dragStartX === null || dragStartY === null || !container) {
            resetDrag();
            return;
        }

        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;

        const width = container.clientWidth || window.innerWidth;
        const distanceRatio = Math.abs(dx) / width;

        const angleRadians = dx === 0 ? Math.PI / 2 : Math.atan(dy / dx);
        const angleDegrees = Math.abs((angleRadians * 180) / Math.PI);

        const atFirst = currentIndex === 0;
        const atLast = currentIndex >= total - 1;

        if ((dx < 0 && atLast) || (dx > 0 && atFirst)) {
            snapBack();
            return;
        }

        if (angleDegrees > maxAngleDegrees || distanceRatio < cancelDistanceRatio) {
            snapBack();
            return;
        }

        if (distanceRatio < minDistanceRatio) {
            snapBack();
            return;
        }

        if (dx < 0 && !atLast) {
            currentIndex = currentIndex + 1;
        } else if (dx > 0 && !atFirst) {
            currentIndex = currentIndex - 1;
        }

        pageInput = String(currentIndex + 1);
        resetDrag();
    }

    function resetDrag() {
        isDragging = false;
        dragStartX = null;
        dragStartY = null;
        dragOffset = 0;
    }

    function snapBack() {
        isDragging = false;
        dragStartX = null;
        dragStartY = null;
        dragOffset = 0;
    }
</script>

<style>
    .page {
        min-height: 100vh;
        background-color: #355e3b;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        font-family: 'GoudyBookletter1911', serif;
        color: #000000dd;
        touch-action: none;
    }
    .content {
        max-width: 900px;
        margin: 0 auto;
        padding: 5px 8px 5px 8px;
    }
    .corner-box,
    .corner-button {
        position: fixed;
        z-index: 20;
        background: none;        
        backdrop-filter: none;   
        border: none;           
        padding: 0;              
        margin: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 22px;
        color: black;
    }
    .top-left { top: 0px; left: 16px; }
    .top-right { 
        top: 8px; 
        right: 16px; 
        display: flex;
        align-items: flex-end;
        gap: 4px;
    }
    .goto-input {
        width: 22px;
        text-align: center; 
        background-color: #EEE8DF;
    }
    /* Remove number input spinners (Chrome, Edge, Safari) */
    .goto-input::-webkit-inner-spin-button,
    .goto-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .goto-input:focus {
        outline: none;        /* removes the white border */
        box-shadow: none;     /* removes any glow or shadow */
    }
    .bottom-left { left: 16px; }
    .bottom-right { right: 16px; }
    .bottom-bar { font-size: 18px; bottom: 16px;}
    .arrow-fixed {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        z-index: 20;
        padding: 0;
        font-size: 44px;
        background: none;
        backdrop-filter: blur(6px);
        border-radius: 999px;
        border: none;
        cursor: pointer;
        opacity: 0.5;
        font-weight: 300;
    }
    .arrow-fixed:hover { opacity: 1;}
    .arrow-left { left: 16px; }
    .arrow-right { right: 16px; }
    .arrow-fixed:disabled { opacity: 0; cursor: default;}
    .photo-wrapper {
        display: flex;
        justify-content: center;
        touch-action: none;
        flex: 1;       /* let it take remaining space */
        min-width: 0;  /* allow it to shrink on narrow screens */
    }
    .photo-inner {
        max-width: 100%;
        max-height: 70vh;
        border-radius: 12px;
        background: transparent;
        overflow: hidden;
        transition: transform 120ms ease-out;
        transform: translateX(0);
        touch-action: none;
        user-select: none;
        justify-content: center;
        display: block;
    }
    .photo-inner.dragging { transition: none;}
    .photo-img {
        display: inline-block;
        height: auto;
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
    }
    .photo-row {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
    }
    .caption {
        font-size: 24px;
        word-wrap: break-word;
        word-break: break-all;
        max-width: 80%;
        margin: 0 auto;
    }
    .link-button {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    }
    .message {
        margin-top: 20px;
        font-size: 24px;
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        border: none;
        padding: 0;
        margin: 0;
        cursor: default;
    }
    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #EEE8DF;
        padding: 20px 28px;
        border-radius: 12px;
        font-family: 'GoudyBookletter1911', serif;
        text-align: center;
        max-width: 300px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
    }
    .modal-text {
        font-size: 24px;
        margin-bottom: 18px;
    }
    .modal-buttons {
        display: flex;
        justify-content: center;
        gap: 20px;
    }
    .modal-button {
        font-family: 'GoudyBookletter1911', serif;
        font-size: 22px;
        padding: 6px 18px;
        border-radius: 8px;
        border: 2px solid #000000dd;
        background: #EEE8DF;
        cursor: pointer;
    }

</style>

<div class="page">
    <div class="content">
        {#if isLoading}
            <div class="message">Loading…</div>
        {:else if !results.length}
            <div class="message">{message ?? 'No matches found.'}</div>
            <div style="margin-top: 20px;">
                <button
                    class="link-button"
                    onclick={async () => { await goto('/'); }}
                >
                    Home
                </button>
            </div>
        {:else}
            {#if hasPhoto()}
                {#key getPhoto().id}
                    <div class="photo-row">
                        <div class="photo-wrapper">
                            <div
                                class="photo-inner {isDragging ? 'dragging' : ''}"
                                role="img"
                                aria-label="Photo viewer"
                                style="transform: translateX({dragOffset}px);"
                                onpointerdown={handlePointerDown}
                                onpointermove={(e) => handlePointerMove(e, e.currentTarget as HTMLDivElement)}
                                onpointerup={(e) => handlePointerUp(e, e.currentTarget as HTMLDivElement)}
                                onpointercancel={resetDrag}
                            >
                                <img
                                    class="photo-img"
                                    src={getPhoto().url}
                                    alt={getPhoto().caption}
                                />
                            </div>
                        </div>
                    </div>
                {/key}
                <div class="corner-box top-left">
                    {currentIndex + 1}/{total}
                </div>
                <div class="corner-box top-right">
                    <div class="goto-label"></div>
                    <input
                        class="goto-input"
                        type="number"
                        bind:value={pageInput}
                        onkeydown={(e) => e.key === 'Enter' && goToPage()}
                        min="1"
                        max={total}
                    />
                </div>
                <button
                    class="corner-button bottom-left bottom-bar"
                    title="Go to Home Screen"
                    onclick={async () => { await goto('/') }}
                >
                    🏠
                </button>
                <button
                    class="corner-button bottom-right bottom-bar"
                    title="Delete this photo"
                    onclick={() => {
                        deleteId = getPhoto().id;
                        showDeleteModal = true;
                    }}
                >
                    🗑️
                </button>
                <button
                    class="arrow-fixed arrow-left"
                    onclick={() => {
                        if (currentIndex > 0) {
                            currentIndex -= 1;
                            pageInput = String(currentIndex + 1);
                            dragOffset = 0;
                        }
                    }}
                    disabled={currentIndex === 0}
                >
                    &laquo;
                </button>
                <button
                    class="arrow-fixed arrow-right"
                    onclick={() => {
                        if (currentIndex < total - 1) {
                            currentIndex += 1;
                            pageInput = String(currentIndex + 1);
                            dragOffset = 0;
                        }
                    }}
                    disabled={currentIndex >= total - 1}
                >
                    &raquo;
                </button>
                <div class="caption">
                    {getPhoto().caption}
                </div>
            {/if}

        {/if}
        {#if showDeleteModal}
            <button
                type="button"
                class="modal-overlay"
                aria-label="Close delete confirmation"
                onclick={() => showDeleteModal = false}
            ></button>

            <div class="modal">
                <div class="modal-text">
                    Are you sure you want to delete this photo?
                </div>
                <div class="modal-buttons">
                    <button
                        class="modal-button"
                        onclick={() => {
                            showDeleteModal = false;
                            if (deleteId !== null) {
                                deletePhoto(deleteId);
                            }
                        }}
                    >
                        Yes
                    </button>
                    <button
                        class="modal-button"
                        onclick={() => showDeleteModal = false}
                    >
                        No
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>