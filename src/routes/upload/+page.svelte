<script lang="ts">
    let selectedImage = $state<File | null>(null);
    let previewUrl = $state<string | null>(null);
    let confirmed = $state(false);
    let caption = $state("");
    let errorTitle = $state("");
    let errorMessage = $state("");
    let showModal = $state(false);

    const maxFileSizeBytes = 5 * 1024 * 1024;
    const maxDimension = 2000;

    let canSubmit = $derived(confirmed && selectedImage !== null);

    const openDialog = (title: string, message: string) => {
        errorTitle = title;
        errorMessage = message;
        showModal = true;
    };

    const closeDialog = () => {
        showModal = false;
    };

    async function getExifOrientation(file: File): Promise<number> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const view = new DataView(e.target?.result as ArrayBuffer);
                if (view.getUint16(0, false) !== 0xffd8) return resolve(1);

                let offset = 2;
                while (offset < view.byteLength) {
                    const marker = view.getUint16(offset, false);
                    offset += 2;

                    if (marker === 0xffe1) {
                        offset += 2;
                        if (view.getUint32(offset, false) !== 0x45786966) return resolve(1);
                        offset += 6;

                        const little = view.getUint16(offset, false) === 0x4949;
                        offset += view.getUint32(offset + 4, little);

                        const tags = view.getUint16(offset, little);
                        offset += 2;

                        for (let i = 0; i < tags; i++) {
                            const tag = view.getUint16(offset + i * 12, little);
                            if (tag === 0x0112) {
                                const orientation = view.getUint16(offset + i * 12 + 8, little);
                                return resolve(orientation);
                            }
                        }
                    } else if ((marker & 0xff00) !== 0xff00) break;
                    else offset += view.getUint16(offset, false);
                }
                resolve(1);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    const pickImage = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];

        try {
            const orientation = await getExifOrientation(file);

            const bitmap = await createImageBitmap(file);
            let { width, height } = bitmap;

            if (width > maxDimension || height > maxDimension) {
                const scale = Math.min(maxDimension / width, maxDimension / height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                selectedImage = file;
                previewUrl = URL.createObjectURL(file);
                return;
            }

            if (orientation > 4) {
                canvas.width = height;
                canvas.height = width;
            } else {
                canvas.width = width;
                canvas.height = height;
            }

            switch (orientation) {
                case 2: ctx.scale(-1, 1); ctx.drawImage(bitmap, -width, 0, width, height); break;
                case 3: ctx.rotate(Math.PI); ctx.drawImage(bitmap, -width, -height, width, height); break;
                case 4: ctx.scale(1, -1); ctx.drawImage(bitmap, 0, -height, width, height); break;
                case 5: ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); ctx.drawImage(bitmap, 0, -height, width, height); break;
                case 6: ctx.rotate(0.5 * Math.PI); ctx.drawImage(bitmap, 0, -height, width, height); break;
                case 7: ctx.rotate(0.5 * Math.PI); ctx.scale(-1, 1); ctx.drawImage(bitmap, -width, -height, width, height); break;
                case 8: ctx.rotate(-0.5 * Math.PI); ctx.drawImage(bitmap, -width, 0, width, height); break;
                default: ctx.drawImage(bitmap, 0, 0, width, height);
            }

            let finalBlob: Blob = file;

            if (file.size > maxFileSizeBytes) {
                finalBlob = await new Promise((resolve) =>
                    canvas.toBlob((blob) => resolve(blob as Blob), "image/jpeg", 0.7)
                );
            }

            selectedImage = new File([finalBlob], file.name, { type: finalBlob.type });
            previewUrl = URL.createObjectURL(selectedImage);
        } catch {
            selectedImage = file;
            previewUrl = URL.createObjectURL(file);
        }
    };

    const uploadPhoto = async () => {
        if (!selectedImage) return;

        if (caption.trim().length === 0) {
            openDialog("Caption needed.", "Please give some clues.");
            return;
        }

        const formData = new FormData();
        formData.append("caption", caption.trim());
        formData.append("file", selectedImage);

        let response: Response;
        try {
            response = await fetch("https://app-still-snow-1787.fly.dev/upload", {
                method: "POST",
                body: formData
            });
        } catch {
            openDialog("Network error.", "Could not reach server.");
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            openDialog("Upload failed.", text);
            return;
        }

        const data = await response.json();
        if (!data.public_url || !data.filename || !data.id) {
            openDialog("Error.", "Server response invalid.");
            return;
        }

        openDialog("Upload successful.", "");
    };
</script>

<style>
    .page {
        min-height: 100vh;
        background-image: url('/wood_wall.jpeg');
        background-size: cover;
        background-position: center top;
        background-attachment: fixed;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 20px 80px 20px; /* extra bottom padding */
        font-family: 'GoudyBookletter1911', serif;
    }

    .title {
        font-size: 34px;
        color: black;
        margin-bottom: 5px;
        text-align: center;
    }

    .content {
        width: 100%;
        max-width: 700px;
        text-align: center;
        color: black;
        font-size: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }


    .rules-wrapper {
        display: inline-block;   /* centers the whole block */
        text-align: left;        /* aligns bullets + checkbox together */
        margin: 0 auto;          /* centers the wrapper */
    }
    
    .rules-line {
        list-style-position: outside;  /* default, keeps bullets nicely aligned */
        padding-left: 1.2rem;          /* space for bullets */
        margin: 0 auto;                /* centers the whole block */
        display: inline-block;         /* allows centering while keeping left alignment */
        text-align: left;              /* text + bullets all align on the left */
        font-size: 24px;
    }

    .rules-line li {
        margin: 2px 0;
    }

    .rules-line li::marker {
        font-size: 0.6em;              /* shrink bullet size */
    }

    .checkbox-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 3px;
        font-size: 24px;
    }

    .file-button {
        display: inline-block;
        background: transparent;
        padding: 2px 28px;
        border-radius: 8px;
        font-size: 24px;
        cursor: pointer;
        margin: 10px 0;
        color: #000000dd;
        border: 1.5px solid #000000dd;
        font-family: 'GoudyBookletter1911', serif;
    }

    .preview-space {
        width: 100%;
        margin-bottom: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .preview {
        max-width: 100%;
        max-height: 260px;
        border-radius: 8px;
    }

    .caption-wrapper {
        position: relative;
        width: 100%;
        max-width: 700px;
        margin: 0 auto 20px auto;
    }

    .caption-box {
        width: 100%;
        height: 120px;
        font-size: 26px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #aaa;
        resize: none;
        font-family: 'GoudyBookletter1911', serif;
        box-sizing: border-box;
    }

    .helper-text {
        position: absolute;
        bottom: -40px;          /* adjust to sit close to the border */
        left: 0;              /* gentle inset from the left edge */
        font-size: 20px;
        color: #262323;            /* soft, unobtrusive */
        line-height: 1.2;
        pointer-events: none;   /* avoids interfering with clicks */
        text-align: left;
    }

    .counter {
        position: absolute;
        bottom: -14px;
        right: 12px;
        font-size: 20px;
        color: #444;
    }

    .submit-button {
        padding: 2px 28px;
        font-size: 26px;
        border-radius: 8px;
        background: transparent;
        color: #000000dd;
        cursor: pointer;
        border: 1.5px solid #000000dd;
        font-family: 'GoudyBookletter1911', serif;
        margin-bottom: 40px; /* space below submit */
    }

    /* Fixed toast-style popup above submit area */
    .toast-modal {
        position: fixed;
        left: 50%;
        bottom: 120px; /* sits above submit area */
        transform: translateX(-50%);
        z-index: 1000;
        background: #eee8dfdd;
        color: #000;
        padding: 20px 24px;
        border-radius: 12px;
        max-width: 90%;
        width: 360px;
        text-align: center;
        box-sizing: border-box;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .dialog-title {
        font-size: 28px;
        margin-bottom: 8px;
    }

    .dialog-message {
        font-size: 22px;
        margin-bottom: 16px;
    }

    .dialog-button {
        padding: 8px 22px;
        font-size: 22px;
        border-radius: 8px;
        background: transparent;
        border: 2px solid #355e3b;
        cursor: pointer;
        font-family: 'GoudyBookletter1911', serif;
    }
</style>

<div class="page">
    <div class="title">[Upload Photos]📤</div>

    <div class="content">
    <div class="rules-wrapper">
        <ul class="rules-line">
            <li>Nothing illegal</li>
            <li>No AI image</li>
            <li>Won’t upset others</li>
        </ul>

        <div class="checkbox-row">
            <input
                type="checkbox"
                checked={confirmed}
                onchange={(e) => (confirmed = (e.target as HTMLInputElement).checked)}
            />
            <div>I confirm all of the above</div>
        </div>
    </div>
        <label class="file-button">
            Select a photo
            <input
                type="file"
                accept="image/*"
                onchange={pickImage}
                style="display:none"
            />
        </label>

        <div class="preview-space">
            {#if previewUrl}
                <img class="preview" src={previewUrl} alt="Preview" />
            {/if}
        </div>

        <div class="caption-wrapper">
            <textarea
                class="caption-box"
                maxlength="120"
                value={caption}
                oninput={(e) => (caption = (e.target as HTMLTextAreaElement).value)}
                placeholder="Caption here, 120 characters max"
            ></textarea>

            <div class="helper-text">
                <div>*What, where, when</div>
                <div>*Please be specific</div>
            </div>
            <div class="counter">{caption.length}/120</div>
        </div>

        <button
            class="submit-button"
            disabled={!canSubmit}
            onclick={uploadPhoto}
        >
            Submit
        </button>
    </div>

    {#if showModal}
        <div class="toast-modal">
            <div class="dialog-title">{errorTitle}</div>
            {#if errorMessage}
                <div class="dialog-message">{errorMessage}</div>
            {/if}
            <button class="dialog-button" onclick={closeDialog}>OK</button>
        </div>
    {/if}
</div>
