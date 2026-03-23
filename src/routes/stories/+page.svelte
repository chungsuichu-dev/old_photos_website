<script>
    const sendEmail = () => {
        window.location.href =
            "mailto:oldphotosconnect@gmail.com?subject=" +
            encodeURIComponent("My Story for Old Photos Connect");
    };
</script>

<style>
    .page {
        min-height: 100vh;
        background-color: #355e3b; /* deep green */
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px;
    }

    .title {
        font-family: 'GoudyBookletter1911', serif;
        font-size: 34px;
        color: black;
        margin-bottom: 40px;
        text-align: center;
    }

    .content {
        max-width: 700px;
        text-align: center;
        font-family: 'GoudyBookletter1911', serif;
        color: black;
        font-size: 30px;
        line-height: 1.4;
        margin-bottom: 40px; /* ensures button sits below the text */
    }

    .story-button {
        padding: 14px 28px;
        font-family: 'GoudyBookletter1911', serif;
        font-size: 26px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: #eee8df;
        color: #000000dd;
    }
</style>

<div class="page">
    <div class="title">[Stories]</div>

    <div class="content">
        🌷You can send us your beautiful stories.<br>
        We may post them here.🌷
    </div>

    <button class="story-button" onclick={sendEmail}>
        Email Your Story
    </button>
</div>
