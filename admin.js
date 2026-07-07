// admin.js
// 管理者画面用のスクリプト（GASとの同期機能付き）

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
    
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxDAPTrb0Inv3lXp5HY4YYko2kKag9MTanHwNieWrDB8mde99vlijirlGwQCq32fTgk/exec';

    // --- 要素の取得 ---
    const ticketAccordionContainer = document.getElementById('ticketAccordionContainer');
    const barAccordionContainer = document.getElementById('barAccordionContainer');
    const totalCountSpan = document.getElementById('totalCount');
    const barTotalCountSpan = document.getElementById('barTotalCount');
    const refreshBtn = document.getElementById('refreshBtn');

    const adminEventForm = document.getElementById('adminEventForm');
    const eventTableBody = document.getElementById('eventTableBody');

    // --- 認証機能の初期設定 ---
    let adminToken = sessionStorage.getItem('adminToken') || '';
    const authOverlay = document.getElementById('authOverlay');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const authLoginBtn = document.getElementById('authLoginBtn');
    const authErrorMsg = document.getElementById('authErrorMsg');

    // 時間の選択肢(30分ごと)を自動生成
    const eventTimeSelect = document.getElementById('eventTime');
    if (eventTimeSelect) {
        for (let i = 0; i < 24; i++) {
            const h = String(i).padStart(2, '0');
            eventTimeSelect.insertAdjacentHTML('beforeend', `<option value="${h}:00" style="color:#000;">${h}:00</option>`);
            eventTimeSelect.insertAdjacentHTML('beforeend', `<option value="${h}:30" style="color:#000;">${h}:30</option>`);
        }
    }

    // =====================================
    // 画像ドラッグ＆ドロップと圧縮処理
    // =====================================
    const dropZone = document.getElementById('imageDropZone');
    const fileInput = document.getElementById('eventImageFile');
    const imagePreview = document.getElementById('eventImagePreview');
    const imageUrlInput = document.getElementById('eventImageUrl');
    const dropZoneText = document.getElementById('dropZoneText');
    const removeImageBtn = document.getElementById('removeImageBtn');

    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary-color)';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'rgba(255,255,255,0.3)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255,255,255,0.3)';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processImageFile(e.dataTransfer.files[0]);
            }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                processImageFile(e.target.files[0]);
            }
        });
        removeImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetImageUpload();
        });
    }

    function processImageFile(file) {
        if (!file.type.match('image.*')) return;
        
        dropZoneText.textContent = "画像圧縮中...";
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // GASの50,000文字制限を回避するため、品質を調整
                let quality = 0.7;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // もし50000文字を超える場合は品質をさらに下げる
                while (dataUrl.length > 45000 && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                if (dataUrl.length > 50000) {
                    alert("画像が大きすぎます。もっと小さな画像を選んでください。");
                    resetImageUpload();
                    return;
                }

                imageUrlInput.value = dataUrl;
                imagePreview.src = dataUrl;
                imagePreview.style.display = 'block';
                dropZoneText.style.display = 'none';
                removeImageBtn.style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function resetImageUpload() {
        imageUrlInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        dropZoneText.innerHTML = '画像をドラッグ＆ドロップ<br>またはクリックして選択';
        dropZoneText.style.display = 'block';
        removeImageBtn.style.display = 'none';
        if (fileInput) fileInput.value = '';
    }

    // =====================================
    // GASとの通信・データ同期
    // =====================================
    async function fetchAllDataFromGAS() {
        if (!adminToken) return;
        if (refreshBtn) refreshBtn.textContent = '同期中...';
        try {
            const fd = new FormData();
            fd.append('type', 'admin_get');
            fd.append('password', adminToken);
            const response = await fetch(GAS_URL, { method: 'POST', body: fd });
            const data = await response.json();
            
            if (data.events) {
                localStorage.setItem('admin_events', JSON.stringify(data.events));
            }
            if (data.reservations) {
                const tickets = data.reservations.filter(r => r.type === 'ticket');
                const barRes = data.reservations.filter(r => r.type === 'bar');
                
                let localTickets = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                let localBar = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
                
                tickets.forEach(rt => {
                   if (!localTickets.find(lt => lt.id == rt.id || (lt.name == rt.name && (lt.submittedAt == rt.submittedAt || lt.date == rt.date)))) {
                       localTickets.push(rt);
                   }
                });
                barRes.forEach(rb => {
                   if (!localBar.find(lb => lb.id == rb.id || (lb.name == rb.name && (lb.createdAt == rb.createdAt || lb.date == rb.date)))) {
                       localBar.push(rb);
                   }
                });
                
                localStorage.setItem('lala_reservations', JSON.stringify(localTickets));
                localStorage.setItem('lala_bar_reservations', JSON.stringify(localBar));
            }
            console.log("GAS Data synchronized successfully.");
        } catch (error) {
            console.error("GAS Sync Error:", error);
            // alert("データの同期に失敗しました。オフラインモードで表示します。");
        } finally {
            if (refreshBtn) refreshBtn.textContent = '↻ 全データを最新に更新';
            loadAllFromLocal();
        }
    }

    // =====================================
    // アコーディオン生成の共通関数
    // =====================================
    function buildAccordion(container, groupedData, renderRowFn, headersHTML) {
        if (!container) return;
        container.innerHTML = '';
        
        const keys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
        
        keys.forEach(key => {
            const items = groupedData[key];
            const itemHTML = `
                <div class="accordion-item">
                    <div class="accordion-header" onclick="this.nextElementSibling.classList.toggle('active'); this.querySelector('.accordion-icon').classList.toggle('open');">
                        <span>${key} <span style="font-size:0.8rem; font-weight:normal;">(${items.length}件)</span></span>
                        <span class="accordion-icon">▼</span>
                    </div>
                    <div class="accordion-content">
                        <div class="table-responsive" style="margin-bottom:0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        ${headersHTML}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(renderRowFn).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    // =====================================
    // 1. チケット予約データの表示
    // =====================================
    function loadTicketReservations() {
        const reservations = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
        if (totalCountSpan) totalCountSpan.textContent = parseInt(reservations.length, 10);

        if (reservations.length === 0 && ticketAccordionContainer) {
            ticketAccordionContainer.innerHTML = `<div class="no-data">現在、チケットの予約はありません。</div>`;
            return;
        }

        const grouped = {};
        reservations.forEach(res => {
            const key = res.target || res.liveTitle || '不明なライブ';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(res);
        });

        if (ticketAccordionContainer) {
            ticketAccordionContainer.innerHTML = '';
            const keys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
            keys.forEach(key => {
                const list = grouped[key];
                const totalCount = list.reduce((sum, r) => sum + (parseInt(r.count, 10) || 0), 0);
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'accordion-item fade-in-up';
                
                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                
                const titleSpan = document.createElement('span');
                titleSpan.innerHTML = key + ' <span style="font-size:0.8rem; font-weight:normal;">(' + list.length + '件 / ' + totalCount + '名)</span>';
                titleSpan.style.flexGrow = '1';
                
                const printBtn = document.createElement('button');
                printBtn.className = 'btn outline-btn print-btn';
                printBtn.textContent = '🖨️ 印刷';
                printBtn.style.padding = '5px 10px';
                printBtn.style.fontSize = '0.8rem';
                printBtn.style.marginRight = '15px';
                printBtn.style.zIndex = '10';
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'accordion-icon';
                iconSpan.textContent = '▼';
                
                header.appendChild(titleSpan);
                header.appendChild(printBtn);
                header.appendChild(iconSpan);
                
                const content = document.createElement('div');
                content.className = 'accordion-content';
                
                let tableHTML = `
                    <div class="table-responsive" style="margin-bottom:0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>申込日時</th>
                                    <th>名前</th>
                                    <th>メアド</th>
                                    <th>人数</th>
                                    <th>決済</th>
                                    <th>メッセージ</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                list.forEach(res => {
                    const safeMsg = res.message ? res.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '-';
                    const dateStr = res.submittedAt || res.date || '-';
                    const isPaid = res.paid === true || res.paid === 'true' || res.paid === 'TRUE';
                    tableHTML += `
                        <tr>
                            <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
                            <td>${escapeHTML(res.name)}</td>
                            <td>${escapeHTML(res.email)}</td>
                            <td>${escapeHTML(res.count)}名</td>
                            <td style="text-align:center;">
                                <input type="checkbox" class="paid-checkbox" data-time="${dateStr}" data-email="${res.email}" ${isPaid ? 'checked' : ''} style="cursor: pointer; transform: scale(1.5);">
                            </td>
                            <td style="font-size: 0.85rem;">${safeMsg}</td>
                        </tr>
                    `;
                });
                
                tableHTML += `
                            </tbody>
                        </table>
                    </div>
                `;
                content.innerHTML = tableHTML;
                
                header.addEventListener('click', (e) => {
                    if (e.target.classList.contains('print-btn') || e.target.tagName === 'INPUT') return;
                    content.classList.toggle('active');
                    iconSpan.classList.toggle('open');
                });
                
                printBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    printEventReservations(key, list);
                });
                
                itemDiv.appendChild(header);
                itemDiv.appendChild(content);
                ticketAccordionContainer.appendChild(itemDiv);
            });
            
            // Event listeners for paid checkboxes
            document.querySelectorAll('.paid-checkbox').forEach(cb => {
                cb.addEventListener('change', async (e) => {
                    const isChecked = e.target.checked;
                    const time = e.target.getAttribute('data-time');
                    const email = e.target.getAttribute('data-email');
                    
                    try {
                        e.target.disabled = true;
                        const fd = new FormData();
                        fd.append('type', 'toggle_paid');
                        fd.append('password', adminToken);
                        fd.append('submittedAt', time);
                        fd.append('email', email);
                        fd.append('paid', isChecked);
                        
                        const res = await fetch(GLOBAL_GAS_URL, { method: 'POST', body: fd });
                        const data = await res.json();
                        if (data.result !== 'success') {
                            alert('決済状況の保存に失敗しました。');
                            e.target.checked = !isChecked;
                        } else {
                            const reservations = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                            const targetRes = reservations.find(r => r.submittedAt === time && r.email === email);
                            if (targetRes) {
                                targetRes.paid = isChecked;
                                localStorage.setItem('lala_reservations', JSON.stringify(reservations));
                            }
                        }
                    } catch(err) {
                        alert('通信エラーが発生しました。');
                        e.target.checked = !isChecked;
                    } finally {
                        e.target.disabled = false;
                    }
                });
            });
        }
    }

    function printEventReservations(title, list) {
        let printWin = window.open('', '_blank');
        let html = `
            <html>
            <head>
                <title>${escapeHTML(title)} 予約リスト</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { font-size: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #999; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                    .center { text-align: center; }
                    .paid { color: green; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>${escapeHTML(title)} 予約リスト</h1>
                <p>総予約件数: ${list.length}件 / 合計人数: ${list.reduce((s, r) => s + (parseInt(r.count, 10) || 0), 0)}名</p>
                <table>
                    <thead>
                        <tr>
                            <th>お名前</th>
                            <th>人数</th>
                            <th>決済</th>
                            <th>メッセージ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(r => {
                            const isPaid = r.paid === true || r.paid === 'true' || r.paid === 'TRUE';
                            const paidText = isPaid ? '<span class="paid">済</span>' : '未';
                            return `<tr>
                                <td>${escapeHTML(r.name)}</td>
                                <td class="center">${escapeHTML(r.count)}名</td>
                                <td class="center">${paidText}</td>
                                <td>${escapeHTML(r.message || '')}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        printWin.document.write(html);
        printWin.document.close();
    }

    // =====================================
    // 2. BAR予約データの表示
    // =====================================
    function loadBarReservations() {
        const reservations = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
        if (barTotalCountSpan) barTotalCountSpan.textContent = parseInt(reservations.length, 10);

        if (reservations.length === 0 && barAccordionContainer) {
            barAccordionContainer.innerHTML = `<div class="no-data">現在、BARの予約はありません。</div>`;
            return;
        }

        const grouped = {};
        reservations.forEach(res => {
            const key = res.target || res.date || '不明な日付';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(res);
        });

        const headers = `<th>時間(2h)</th><th>申込日時</th><th>人数</th><th>お名前(Email)</th><th>メッセージ</th>`;
        const renderRow = (res) => {
            const safeMsg = res.message ? res.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '-';
            const dateStr = res.submittedAt || res.createdAt || '-';
            const timeStr = res.time || (res.target ? res.target.split(' ')[1] : '-');
            return `
                <tr>
                    <td>${timeStr}〜</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
                    <td>${res.count}名</td>
                    <td>${escapeHTML(res.name)}<br><span style="font-size:0.8rem;color:var(--text-muted);">${res.email}</span></td>
                    <td style="font-size: 0.85rem;">${safeMsg}</td>
                </tr>
            `;
        };

        buildAccordion(barAccordionContainer, grouped, renderRow, headers);
    }

    // =====================================
    // 3. イベントデータの表示と登録
    // =====================================
    function loadEvents() {
        const events = JSON.parse(localStorage.getItem('admin_events') || '[]');
        if (eventTableBody) eventTableBody.innerHTML = ''; 

        if (events.length === 0 && eventTableBody) {
            eventTableBody.innerHTML = `<tr><td colspan="5" class="no-data" style="padding: 10px;">登録されていません</td></tr>`;
            return;
        }

        events.sort((a,b) => new Date(a.date) - new Date(b.date));

        events.forEach(ev => {
            if (!eventTableBody) return;
            const typeLabel = ev.type === 'NEWS' ? '<span style="color:#f39c12; font-size:0.8rem;">NEWS</span>' : '<span style="color:var(--primary-color); font-size:0.8rem;">LIVE</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ev.date}</td>
                <td>${ev.time || '-'}</td>
                <td>${typeLabel}</td>
                <td>${escapeHTML(ev.title)}</td>
                <td>
                    <button class="edit-btn outline-btn" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" data-id="${ev.id}">編集</button>
                    <button class="delete-btn" data-id="${ev.id}">削除</button>
                </td>
            `;
            eventTableBody.appendChild(tr);
        });

        // 削除・編集ボタンのイベントハンドラ
        document.querySelectorAll('.delete-btn[data-id]').forEach(btn => {
            btn.onclick = () => deleteEvent(btn.getAttribute('data-id'));
        });
        document.querySelectorAll('.edit-btn[data-id]').forEach(btn => {
            btn.onclick = () => editEvent(btn.getAttribute('data-id'));
        });
    }

    function editEvent(id) {
        const events = JSON.parse(localStorage.getItem('admin_events') || '[]');
        const ev = events.find(e => e.id.toString() === id.toString());
        if (!ev) return;

        document.getElementById('eventId').value = ev.id;
        
        let dateVal = ev.date || '';
        if (dateVal && dateVal.includes('/')) {
            dateVal = dateVal.replace(/\//g, '-');
        } else if (dateVal && dateVal.includes('T')) {
            dateVal = dateVal.split('T')[0];
        }
        document.getElementById('eventDate').value = dateVal;
        
        if (document.getElementById('eventTime')) document.getElementById('eventTime').value = ev.time || '';
        if (document.getElementById('eventCategory')) document.getElementById('eventCategory').value = ev.type || 'LIVE';
        document.getElementById('eventTitle').value = ev.title;
        if (document.getElementById('eventCapacity')) document.getElementById('eventCapacity').value = ev.capacity || '50';
        document.getElementById('eventDescription').value = ev.description || '';
        
        const imageUrlInput = document.getElementById('eventImageUrl');
        const imagePreview = document.getElementById('eventImagePreview');
        const dropZoneText = document.getElementById('dropZoneText');
        const removeImageBtn = document.getElementById('removeImageBtn');
        
        imageUrlInput.value = ev.imageUrl || '';
        if (ev.imageUrl) {
            imagePreview.src = ev.imageUrl;
            imagePreview.style.display = 'block';
            if (dropZoneText) dropZoneText.style.display = 'none';
            if (removeImageBtn) removeImageBtn.style.display = 'block';
        } else {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            if (dropZoneText) dropZoneText.style.display = 'block';
            if (removeImageBtn) removeImageBtn.style.display = 'none';
        }

        document.getElementById('eventSubmitBtn').textContent = '更新';
        document.getElementById('eventCancelEditBtn').style.display = 'inline-block';
        
        // フォームまでスクロール
        document.getElementById('adminEventForm').scrollIntoView({ behavior: 'smooth' });
    }

    const eventCancelEditBtn = document.getElementById('eventCancelEditBtn');
    if (eventCancelEditBtn) {
        eventCancelEditBtn.addEventListener('click', () => {
            document.getElementById('adminEventForm').reset();
            document.getElementById('eventId').value = '';
            if (typeof resetImageUpload === 'function') resetImageUpload();
            document.getElementById('eventSubmitBtn').textContent = '追加';
            eventCancelEditBtn.style.display = 'none';
        });
    }

    if (adminEventForm) {
        adminEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('eventSubmitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = '保存中...';

            const eventId = document.getElementById('eventId').value;
            const isEdit = eventId !== '';
            
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime') ? document.getElementById('eventTime').value : '';
            const category = document.getElementById('eventCategory') ? document.getElementById('eventCategory').value : 'LIVE';
            const title = document.getElementById('eventTitle').value;
            const capacity = document.getElementById('eventCapacity') ? document.getElementById('eventCapacity').value : '50';
            const description = document.getElementById('eventDescription').value;
            const imageUrl = document.getElementById('eventImageUrl').value;
            const id = isEdit ? eventId : Date.now();
            
            // GASへ保存
            const payload = {
                type: isEdit ? 'edit_event' : 'event',
                password: adminToken,
                id: id,
                date: date,
                time: time,
                event_type: category,
                title: title,
                description: description,
                imageUrl: imageUrl
            };

            const formData = new URLSearchParams();
            for (const key in payload) {
                formData.append(key, payload[key]);
            }

            try {
                // 先にローカルのUIを更新する（フェールセーフ）
                let localEvents = JSON.parse(localStorage.getItem('admin_events') || '[]');
                const eventData = {
                    id: id.toString(),
                    date: date,
                    time: time,
                    type: category,
                    title: title,
                    description: description,
                    imageUrl: imageUrl
                };

                if (isEdit) {
                    localEvents = localEvents.map(e => e.id.toString() === id.toString() ? eventData : e);
                } else {
                    localEvents.push(eventData);
                }
                
                localStorage.setItem('admin_events', JSON.stringify(localEvents));
                adminEventForm.reset();
                document.getElementById('eventId').value = '';
                if (document.getElementById('eventCancelEditBtn')) {
                    document.getElementById('eventCancelEditBtn').style.display = 'none';
                }
                loadAllFromLocal();

                // バックグラウンドでGASへ送信
                await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });
            } catch (error) {
                console.error("Add/Edit Event Error:", error);
                // alert("保存に失敗しました。"); // Safariなどでエラーが出てもローカル保存できているのでアラートは出さない
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '追加';
            }
        });
    }

    async function deleteEvent(id) {
        if (confirm("このイベントを削除しますか？")) {
            const payload = {
                type: 'delete_event',
                password: adminToken,
                id: id
            };

            const formData = new URLSearchParams();
            for (const key in payload) {
                formData.append(key, payload[key]);
            }

            try {
                // 先にローカルのUIを更新
                let localEvents = JSON.parse(localStorage.getItem('admin_events') || '[]');
                localEvents = localEvents.filter(e => e.id.toString() !== id.toString());
                localStorage.setItem('admin_events', JSON.stringify(localEvents));
                loadAllFromLocal();

                // バックグラウンドでGASへ送信
                await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });
            } catch (error) {
                console.error("Delete Event Error:", error);
            }
        }
    };

    // =====================================
    // 全体初期化
    // =====================================
    function loadAllFromLocal() {
        loadTicketReservations();
        loadBarReservations();
        loadEvents();
    }

    // 初回実行用の認証チェック
    async function checkAuthAndLoad() {
        if (!adminToken) {
            if (authOverlay) authOverlay.style.display = 'flex';
            return;
        }
        
        if (authOverlay) authOverlay.style.display = 'none';
        loadAllFromLocal();
        fetchAllDataFromGAS();
    }

    if (authLoginBtn) {
        authLoginBtn.addEventListener('click', async () => {
            const pass = adminPasswordInput.value;
            if (!pass) return;
            
            authLoginBtn.textContent = '認証中...';
            authErrorMsg.style.display = 'none';
            
            try {
                const loginFd = new FormData();
                loginFd.append('type', 'admin_get');
                loginFd.append('password', pass);
                const response = await fetch(GAS_URL, { method: 'POST', body: loginFd });
                const data = await response.json();
                
                if (data.result === 'error' || data.auth !== true) {
                    authErrorMsg.style.display = 'block';
                    authLoginBtn.textContent = 'ログイン';
                } else {
                    // 認証成功
                    adminToken = pass;
                    sessionStorage.setItem('adminToken', pass);
                    authOverlay.style.display = 'none';
                    
                    if (data.events) localStorage.setItem('admin_events', JSON.stringify(data.events));
                    if (data.reservations) {
                        const tickets = data.reservations.filter(r => r.type === 'ticket');
                        const barRes = data.reservations.filter(r => r.type === 'bar');
                        
                        let localTickets = JSON.parse(localStorage.getItem('lala_reservations') || '[]');
                        let localBar = JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]');
                        
                        tickets.forEach(rt => {
                           if (!localTickets.find(lt => lt.id == rt.id || (lt.name == rt.name && (lt.submittedAt == rt.submittedAt || lt.date == rt.date)))) {
                               localTickets.push(rt);
                           }
                        });
                        barRes.forEach(rb => {
                           if (!localBar.find(lb => lb.id == rb.id || (lb.name == rb.name && (lb.createdAt == rb.createdAt || lb.date == rb.date)))) {
                               localBar.push(rb);
                           }
                        });
                        
                        localStorage.setItem('lala_reservations', JSON.stringify(localTickets));
                        localStorage.setItem('lala_bar_reservations', JSON.stringify(localBar));
                    }
                    
                    loadAllFromLocal();
                }
            } catch (e) {
                console.error("Auth Error:", e);
                authErrorMsg.textContent = "通信エラーが発生しました";
                authErrorMsg.style.display = 'block';
                authLoginBtn.textContent = 'ログイン';
            }
        });
    }

    // 初期化実行
    checkAuthAndLoad();

    // 更新ボタンの動作
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchAllDataFromGAS();
        });
    }

    // エクスポート機能 (JSON出力)
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                admin_events: JSON.parse(localStorage.getItem('admin_events') || '[]'),
                lala_reservations: JSON.parse(localStorage.getItem('lala_reservations') || '[]'),
                lala_bar_reservations: JSON.parse(localStorage.getItem('lala_bar_reservations') || '[]'),
                export_date: new Date().toLocaleString('ja-JP')
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lala_fansite_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // インポート機能 (JSON読み込み)
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!confirm('既存のデータは上書きされ、イベントは自動的にスプレッドシートへ送信されます。よろしいですか？')) {
                        importFileInput.value = '';
                        return;
                    }

                    importBtn.textContent = '復元中...';
                    importBtn.disabled = true;

                    // ローカルストレージに復元
                    if (data.admin_events) localStorage.setItem('admin_events', JSON.stringify(data.admin_events));
                    if (data.lala_reservations) localStorage.setItem('lala_reservations', JSON.stringify(data.lala_reservations));
                    if (data.lala_bar_reservations) localStorage.setItem('lala_bar_reservations', JSON.stringify(data.lala_bar_reservations));

                    // 画面の表示を更新
                    loadAllFromLocal();

                    // スプレッドシート（GAS）へイベントデータを送信
                    if (data.admin_events && data.admin_events.length > 0) {
                        for (const ev of data.admin_events) {
                            const payload = {
                                type: 'event',
                                password: adminToken,
                                id: ev.id || Date.now(),
                                date: ev.date || '',
                                time: ev.time || '',
                                event_type: ev.type || 'LIVE',
                                title: ev.title || '',
                                description: ev.description || '',
                                imageUrl: ev.imageUrl || '',
                                capacity: ev.capacity || '50'
                            };

                            const formData = new URLSearchParams();
                            for (const key in payload) {
                                formData.append(key, payload[key]);
                            }

                            try {
                                await fetch(GAS_URL, {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: formData.toString()
                                });
                                // GASの負荷軽減のため少し待機
                                await new Promise(resolve => setTimeout(resolve, 600));
                            } catch (err) {
                                console.error('GAS送信エラー:', err);
                            }
                        }
                    }

                    alert('データの復元が完了しました！\n（※予約データはローカルにのみ復元されます。イベントデータはスプレッドシートへ送信されました）');
                } catch (err) {
                    alert('JSONファイルの読み込みに失敗しました。正しいバックアップファイルか確認してください。');
                    console.error(err);
                } finally {
                    importBtn.textContent = '📂 JSONからデータを復元';
                    importBtn.disabled = false;
                    importFileInput.value = '';
                }
            };
            reader.readAsText(file);
        });
    }
});






