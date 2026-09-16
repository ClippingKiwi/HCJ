document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');

    // 업로드 버튼 클릭 시 파일 선택창 열기
    uploadBtn.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', (e) => {
        if (e.target !== uploadBtn) fileInput.click();
    });

    // 드래그 앤 드롭 이벤트 처리
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleVideoFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleVideoFile(e.target.files[0]);
        }
    });

    // 비디오 파일 처리 및 GIF 변환 함수
    function handleVideoFile(file) {
        if (!file.type.startsWith('video/')) {
            alert('동영상 파일만 업로드 가능합니다.');
            return;
        }

        const fileId = 'file-' + Date.now();
        const videoUrl = URL.createObjectURL(file);

        // 파일 목록 UI 추가
        const fileItemHTML = `
            <div class="file-item" id="${fileId}">
                <div class="thumbnail-container">
                    <video src="${videoUrl}" muted preload="metadata"></video>
                </div>
                <div class="progress-container">
                    <div class="file-name">${file.name}</div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="progress-${fileId}"></div>
                    </div>
                    <div class="progress-text" id="status-${fileId}">변환 준비 중... 0%</div>
                </div>
                <a class="download-btn" id="download-${fileId}" disabled>다운로드</a>
            </div>
        `;
        fileList.insertAdjacentHTML('afterbegin', fileItemHTML);

        const progressBar = document.getElementById(`progress-${fileId}`);
        const statusText = document.getElementById(`status-${fileId}`);
        const downloadBtn = document.getElementById(`download-${fileId}`);

        // GIF 생성 (FPS 제한: 30 FPS)
        // Frame duration calculated for 30 FPS: 1 / 30 = 0.033초
        gifshot.createGIF({
            video: [videoUrl],
            numFrames: 30, // 변환할 총 프레임 수
            frameDuration: 1 / 30, // 30 FPS (프레임 간격)
            sampleInterval: 10,
            numWorkers: 2,
            progressCallback: (captureProgress) => {
                // gifshot의 진행률(0~1)을 %로 환산
                const percent = Math.round(captureProgress * 100);
                progressBar.style.width = `${percent}%`;
                statusText.innerText = `변환 중... ${percent}%`;
            }
        }, function (obj) {
            if (!obj.error) {
                const animatedImage = obj.image;

                // 100% 완료 처리
                progressBar.style.width = '100%';
                statusText.innerText = '변환 완료! (30 FPS)';
                
                // 다운로드 버튼 활성화
                downloadBtn.href = animatedImage;
                downloadBtn.download = `${file.name.split('.')[0]}.gif`;
                downloadBtn.classList.add('active');
                downloadBtn.removeAttribute('disabled');
                downloadBtn.innerText = '다운로드';
            } else {
                statusText.innerText = '변환 실패';
                console.error('GIF 변환 오류:', obj.error);
            }
        });
    }
});