<script lang="ts">
    import { goto } from '$app/navigation';
</script>

<style>
    :global(html, body) {
        height: 100%;
        min-height: 100%;
    }

    .page {
        min-height: 100vh;
        width: 100%;
        background-image: url('/wood_wall.jpeg');
        background-size: cover;
        background-position: left top;
        background-repeat: no-repeat;
        background-attachment: fixed; 
        display: flex;
        justify-content: flex-start;
    }

    .content {
        padding: 30px 20px 140px 20px; /* added bottom space */
        max-width: 800px;
        margin: 0 auto;
        font-family: 'GoudyBookletter1911', serif;
    }

    .title {
        font-size: 34px;
        margin-bottom: 20px;
        text-align: center;
        color: black;
    }

    details {
        background: #EEE8DF;
        border-radius: 12px;
        padding: 8px 0;
        color: #000000dd;
        border: none;          /* safe border removal */
        outline: none;         /* safe outline removal */
        
    }

    summary {
        cursor: pointer;
        font-size: 28px;
        padding: 2px 8px;
        list-style: none;
    }

    summary::-webkit-details-marker {
        display: none;
    }

    .answer {
        font-size: 24px;
        line-height: 1.2;
        padding: 2px 8px 4px 8px;
        text-align: center; /* centered answers */
    }

    /* SAFE attempt to remove faint right-side line */
    .page {
        overflow-x: hidden; /* harmless, prevents horizontal scrollbar track */
    }
</style>

<div class="page">
    <div class="content">

        <div class="title">[FAQs]</div>

        <details>
            <summary>Do I need permission from everyone in the photo before sharing?</summary>
            <div class="answer">No.</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>Which sensitive photos are ok to share?</summary>
            <div class="answer">Photos of yearbook, memorials, gravesites, or obituary.</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>Can you help me identify a person?</summary>
            <div class="answer">No.</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>Do you know who uploaded/searched/viewed/deleted?</summary>
            <div class="answer">No.</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>Duplicate photos?</summary>
            <div class="answer">Each has its own story.</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>Can I show political, religious or sexy pics?</summary>
            <div class="answer">Avoid risking others.</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>Why no social interactions here?</summary>
            <div class="answer">🌿Peace🌿</div>
        </details>

        <div style="height: 20px;"></div>

        <details>
            <summary>What if someone deletes good photos?</summary>
            <div class="answer">Think of here as a shared space for the human family.<br>
                Anyone can share good memories. <br>
                Anyone can remove what bothers them.<br>
                This space is for everyone. 💚
            </div>
        </details>

        <div style="height: 120px;"></div>
    </div>
</div>
