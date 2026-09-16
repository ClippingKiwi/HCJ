document.addEventListener('DOMContentLoaded', () => {
    // Lucide 아이콘 초기화
    lucide.createIcons();

    // 전역 상태 변수
    let selectedFiles = [];
    let processedResults = []; // { name, blob, url }
    let selectedRatio = '1:1';

    // DOM 요소를 가져오기
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const ratioBtns = document.querySelectorAll('.ratio-btn');
    const customRatioContainer = document.getElementById('custom-ratio-container');
    const customW = document.getElementById('custom-w');
    const customH = document.getElementById('custom-h');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const paddingColorContainer = document.getElementById('padding-color-container');
    const bgColorInput = document.getElementById('bg-color');
    const colorCode = document.getElementById('color-code');
    const processSection = document.getElementById('process-section');
    const imageList = document.getElementById('image-list');
    const downloadAllBtn = document.getElementById('download-all-btn');

    // --- 이벤트 리스너 설정 ---

    // 업로드 버튼 클릭
    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 1. 드래그 앤 드롭 이벤트
    dropZone.addEventListener('click', (e) => {
        if (e.target !== selectFilesBtn) {
            fileInput.click();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    });

    // 2. 비율 버튼 클릭 이벤트
    ratioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ratioBtns.forEach(b => b.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-600'));
            btn.classList.add('bg-blue-50', 'border-blue-500', 'text-blue-600');
            selectedRatio = btn.dataset.ratio;

            if (selectedRatio === 'custom') {
                customRatioContainer.classList.remove('hidden');
            } else {
                customRatioContainer.classList.add('hidden');
            }
            reprocessAll();
        });
    });

    [customW, customH].forEach(input => {
        input.addEventListener('input', reprocessAll);
    });

    // 3. 모드 변경 (Padding vs Crop) 및 배경색 선택
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'padding') {
                paddingColorContainer.classList.remove('opacity-40', 'pointer-events-none');
            } else {
                paddingColorContainer.classList.add('opacity-40', 'pointer-events-none');
            }
            reprocessAll();
        });
    });

    bgColorInput.addEventListener('input', (e) => {
        colorCode.innerText = e.target.value.toUpperCase();
        reprocessAll();
    });

    // --- 파일 처리 및 이미지 리사이징 핵심 로직 ---

    function handleFiles(files) {
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        selectedFiles = validFiles;
        processedResults = new Array(selectedFiles.length).fill(null);
        
        // UI 초기화
        processSection.classList.remove('hidden');
        imageList.innerHTML = '';
        downloadAllBtn.disabled = true;
        downloadAllBtn.classList.add('opacity-50', 'cursor-not-allowed');

        // 리스트 UI 생성
        selectedFiles.forEach((file, idx) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4';
            itemEl.id = `item-${idx}`;

            itemEl.innerHTML = `
                <div class="flex items-center space-x-4 w-full sm:w-auto">
                    <img id="thumb-${idx}" class="w-14 h-14 object-cover rounded-lg border border-gray-300 bg-white" src="" alt="thumbnail">
                    <div class="overflow-hidden">
                        <p class="text-sm font-semibold text-gray-800 truncate max-w-[200px]">${file.name}</p>
                        <p class="text-xs text-gray-400">${(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <div class="w-full sm:w-1/2 flex items-center space-x-3">
                    <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div id="progress-${idx}" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <span id="percent-${idx}" class="text-xs font-semibold text-gray-600 w-10 text-right">0%</span>
                </div>
                <a id="download-${idx}" class="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg opacity-50 pointer-events-none hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> 다운로드
                </a>
            `;
            imageList.appendChild(itemEl);

            // 썸네일 노출
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById(`thumb-${idx}`).src = e.target.result;
            };
            reader.readAsDataURL(file);

            // 이미지 작업 수행
            processSingleImage(file, idx);
        });

        lucide.createIcons();
    }

    function reprocessAll() {
        if (selectedFiles.length === 0) return;
        downloadAllBtn.disabled = true;
        downloadAllBtn.classList.add('opacity-50', 'cursor-not-allowed');

        selectedFiles.forEach((file, idx) => {
            processSingleImage(file, idx);
        });
    }

    // 종횡비 값 계산 함수
    function getTargetAspect() {
        if (selectedRatio === 'custom') {
            const w = parseFloat(customW.value) || 1;
            const h = parseFloat(customH.value) || 1;
            return w / h;
        }
        const [w, h] = selectedRatio.split(':').map(Number);
        return w / h;
    }

    // 이미지 변환 엔진 (Canvas 기반)
    function processSingleImage(file, idx) {
        const progressBar = document.getElementById(`progress-${idx}`);
        const percentText = document.getElementById(`percent-${idx}`);
        const downloadBtn = document.getElementById(`download-${idx}`);

        // 프로그레스 리셋
        progressBar.style.width = '0%';
        percentText.innerText = '0%';
        downloadBtn.classList.add('opacity-50', 'pointer-events-none');

        const targetAspect = getTargetAspect();
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const bgColor = bgColorInput.value;

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            // 시각적 프로그레스 업데이트
            updateProgress(idx, 30);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const imgW = img.width;
            const imgH = img.height;
            const imgAspect = imgW / imgH;

            let canvasW, canvasH;

            // 기준 캔버스 해상도 결정
            if (imgAspect > targetAspect) {
                canvasW = imgW;
                canvasH = imgW / targetAspect;
            } else {
                canvasH = imgH;
                canvasW = imgH * targetAspect;
            }

            canvas.width = canvasW;
            canvas.height = canvasH;

            updateProgress(idx, 60);

            if (mode === 'padding') {
                // Padding 처리
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvasW, canvasH);

                const scale = Math.min(canvasW / imgW, canvasH / imgH);
                const drawW = imgW * scale;
                const drawH = imgH * scale;
                const drawX = (canvasW - drawW) / 2;
                const drawY = (canvasH - drawH) / 2;

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else if (mode === 'crop') {
                // Crop 처리
                const scale = Math.max(canvasW / imgW, canvasH / imgH);
                const drawW = imgW * scale;
                const drawH = imgH * scale;
                const drawX = (canvasW - drawW) / 2;
                const drawY = (canvasH - drawH) / 2;

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }

            updateProgress(idx, 90);

            // 결과 이미지를 Blob으로 추출
            canvas.toBlob((blob) => {
                const resultUrl = URL.createObjectURL(blob);
                
                if (processedResults[idx] && processedResults[idx].url) {
                    URL.revokeObjectURL(processedResults[idx].url);
                }

                const ext = file.name.split('.').pop();
                const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
                const newFileName = `${fileNameWithoutExt}_resized.${ext}`;

                processedResults[idx] = {
                    name: newFileName,
                    blob: blob,
                    url: resultUrl
                };

                // 프로그레스 바 100% 완료 처리
                updateProgress(idx, 100);
                downloadBtn.href = resultUrl;
                downloadBtn.download = newFileName;
                downloadBtn.classList.remove('opacity-50', 'pointer-events-none');

                checkAllCompleted();

                URL.revokeObjectURL(url);
            }, file.type || 'image/png');
        };
    }

    function updateProgress(idx, percent) {
        const progressBar = document.getElementById(`progress-${idx}`);
        const percentText = document.getElementById(`percent-${idx}`);
        if (progressBar && percentText) {
            progressBar.style.width = `${percent}%`;
            percentText.innerText = `${percent}%`;
        }
    }

    // 일괄 압축 다운로드 확인
    function checkAllCompleted() {
        const allDone = processedResults.every(res => res !== null);
        if (allDone && processedResults.length > 0) {
            downloadAllBtn.disabled = false;
            downloadAllBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    downloadAllBtn.addEventListener('click', () => {
        if (processedResults.length === 0) return;

        const zip = new JSZip();
        processedResults.forEach(item => {
            zip.file(item.name, item.blob);
        });

        zip.generateAsync({ type: 'blob' }).then((content) => {
            const zipUrl = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = 'resized_images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
        });
    });
});