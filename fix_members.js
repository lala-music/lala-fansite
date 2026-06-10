const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/dashboard_lala_7942.html', 'utf8');

const oldHTML =             <!-- Tab: FC Members -->
            <div id="tab-fc-members" class="tab-pane">
                <div class="admin-card">
                    <h2>ファンクラブ会員一覧 <button class="btn primary-btn" style="float:right; padding: 5px 10px; font-size:0.8rem;" onclick="addMember()">＋ 新規会員追加</button></h2>
                    <p style="text-align: right; margin-bottom: 10px;"><strong>総会員数: <span id="memberTotalCount" style="color: var(--primary-color); font-size: 1.2rem;">0</span> 名</strong></p>
                    <div style="overflow-x: auto;">
                        <table class="data-table" style="font-size: 0.9rem; width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid #444;">
                                    <th style="padding: 10px;">登録日</th>
                                    <th style="padding: 10px;">お名前</th>
                                    <th style="padding: 10px;">メールアドレス</th>
                                    <th style="padding: 10px;">プラン</th>
                                    <th style="padding: 10px;">ステータス</th>
                                    <th style="padding: 10px;">操作</th>
                                </tr>
                            </thead>
                            <tbody id="memberTableBody">
                                <!-- Rendered by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>;

const newHTML =             <!-- Tab: FC Members -->
            <div id="tab-fc-members" class="tab-pane">
                <div class="admin-card">
                    <h2>会員情報の編集・追加</h2>
                    <div class="form-group">
                        <label>お名前 *</label>
                        <input type="text" id="fcMemberName" class="form-control" placeholder="例：山田 太郎">
                    </div>
                    <div class="form-group">
                        <label>メールアドレス *</label>
                        <input type="email" id="fcMemberEmail" class="form-control" placeholder="例：user@example.com">
                    </div>
                    <div class="form-group">
                        <label>住所</label>
                        <input type="text" id="fcMemberAddress" class="form-control" placeholder="例：東京都渋谷区...">
                    </div>
                    <div class="form-group">
                        <label>プラン *</label>
                        <select id="fcMemberTier" class="form-control">
                            <option value="monthly">レギュラー (Monthly)</option>
                            <option value="premier">プレミア (Premier)</option>
                        </select>
                    </div>
                    <button class="btn-submit" onclick="saveFcMember()">追加する</button>
                    <button id="cancelMemberEditBtn" class="btn outline-btn" style="display:none; margin-top:10px; width:100%; padding: 12px; border: 1px solid #555; background: #222; border-radius: 4px; cursor: pointer; color:#fff;" onclick="cancelMemberEdit()">キャンセル</button>
                </div>
                
                <div class="admin-card">
                    <h2>ファンクラブ会員一覧</h2>
                    <p style="text-align: right; margin-bottom: 10px;"><strong>総会員数: <span id="memberTotalCount" style="color: var(--primary-color); font-size: 1.2rem;">0</span> 名</strong></p>
                    <div style="overflow-x: auto;">
                        <table class="data-table" style="font-size: 0.9rem; width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid #444;">
                                    <th style="padding: 10px;">登録日</th>
                                    <th style="padding: 10px;">お名前</th>
                                    <th style="padding: 10px;">メール・住所</th>
                                    <th style="padding: 10px;">プラン</th>
                                    <th style="padding: 10px;">ステータス</th>
                                    <th style="padding: 10px;">操作</th>
                                </tr>
                            </thead>
                            <tbody id="memberTableBody">
                                <!-- Rendered by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>;

const oldScript =         // === Members ===
        function addMember() {
            const name = prompt('会員のお名前を入力してください:');
            if(!name) return;
            const email = prompt('メールアドレスを入力してください:', 'user@example.com');
            const tier = confirm('プレミア会員として登録しますか？\\n(OK=プレミア, キャンセル=レギュラー)') ? 'premier' : 'monthly';
            const data = getLocalStorageData('lala_fc_members');
            const newMember = {
                id: Date.now(),
                name: name,
                email: email || 'user@example.com',
                tier: tier,
                joinDate: new Date().toISOString().split('T')[0]
            };
            data.push(newMember);
            setLocalStorageData('lala_fc_members', data);
            renderMemberList();
        }

        function editMember(id) {
            let data = getLocalStorageData('lala_fc_members');
            const item = data.find(i => i.id === id);
            if(!item) return;
            const name = prompt('名前を変更:', item.name);
            if(name === null) return;
            const tier = confirm('プレミア会員ですか？\\n(OK=プレミア, キャンセル=レギュラー)') ? 'premier' : 'monthly';
            item.name = name;
            item.tier = tier;
            setLocalStorageData('lala_fc_members', data);
            renderMemberList();
        }

        function renderMemberList() {
            const tbody = document.getElementById('memberTableBody');
            const data = getLocalStorageData('lala_fc_members');
            
            document.getElementById('memberTotalCount').innerText = data.length;
            tbody.innerHTML = '';
            
            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">登録されている会員はいません。</td></tr>';
                return;
            }

            // Sort ascending by join date to get sequential member numbers
            data.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                
                const tierColor = item.tier === 'premier' ? '#d4af37' : 'var(--primary-color)';
                const tierLabel = item.tier === 'premier' ? 'プレミア' : 'レギュラー';
                const memberNo = String(index + 1).padStart(6, '0');
                
                tr.innerHTML = \
                    <td style="padding: 10px;">\<br><span style="color:#888; font-size:0.8rem;">No. \</span></td>
                    <td style="padding: 10px;"><strong>\</strong></td>
                    <td style="padding: 10px; color:#aaa;">\</td>
                    <td style="padding: 10px; color:\; font-weight:bold;">\</td>
                    <td style="padding: 10px;"><span style="background:#2ecc71; color:#fff; padding:3px 8px; border-radius:12px; font-size:0.8rem;">有効</span></td>
                    <td style="padding: 10px;">
                        <button class="btn-edit" style="margin-right:5px; padding:3px 8px;" onclick="editMember(\)">編集</button>
                        <button class="btn-delete" style="padding:3px 8px;" onclick="deleteMember(\)">削除</button>
                    </td>
                \;
                tbody.appendChild(tr);
            });
        };

const newScript =         // === Members ===
        let editingMemberId = null;

        function saveFcMember() {
            const name = document.getElementById('fcMemberName').value;
            const email = document.getElementById('fcMemberEmail').value;
            const address = document.getElementById('fcMemberAddress').value;
            const tier = document.getElementById('fcMemberTier').value;

            if(!name || !email) {
                alert('お名前とメールアドレスは必須です。');
                return;
            }

            let data = getLocalStorageData('lala_fc_members');
            if (editingMemberId) {
                const item = data.find(i => i.id === editingMemberId);
                if (item) {
                    item.name = name;
                    item.email = email;
                    item.address = address;
                    item.tier = tier;
                }
                editingMemberId = null;
            } else {
                data.push({
                    id: Date.now(),
                    name: name,
                    email: email,
                    address: address,
                    tier: tier,
                    joinDate: new Date().toISOString().split('T')[0]
                });
            }
            setLocalStorageData('lala_fc_members', data);
            
            // Clear
            document.getElementById('fcMemberName').value = '';
            document.getElementById('fcMemberEmail').value = '';
            document.getElementById('fcMemberAddress').value = '';
            document.getElementById('fcMemberTier').value = 'monthly';
            document.querySelector('#tab-fc-members .btn-submit').textContent = '追加する';
            document.getElementById('cancelMemberEditBtn').style.display = 'none';
            
            renderMemberList();
            alert('保存しました！');
        }

        function editMember(id) {
            let data = getLocalStorageData('lala_fc_members');
            const item = data.find(i => i.id === id);
            if(!item) return;
            
            document.getElementById('fcMemberName').value = item.name || '';
            document.getElementById('fcMemberEmail').value = item.email || '';
            document.getElementById('fcMemberAddress').value = item.address || '';
            document.getElementById('fcMemberTier').value = item.tier || 'monthly';
            
            editingMemberId = id;
            document.querySelector('#tab-fc-members .btn-submit').textContent = '更新する';
            document.getElementById('cancelMemberEditBtn').style.display = 'block';
            window.scrollTo(0,0);
        }

        function cancelMemberEdit() {
            editingMemberId = null;
            document.getElementById('fcMemberName').value = '';
            document.getElementById('fcMemberEmail').value = '';
            document.getElementById('fcMemberAddress').value = '';
            document.getElementById('fcMemberTier').value = 'monthly';
            document.querySelector('#tab-fc-members .btn-submit').textContent = '追加する';
            document.getElementById('cancelMemberEditBtn').style.display = 'none';
        }

        function renderMemberList() {
            const tbody = document.getElementById('memberTableBody');
            const data = getLocalStorageData('lala_fc_members');
            
            document.getElementById('memberTotalCount').innerText = data.length;
            tbody.innerHTML = '';
            
            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">登録されている会員はいません。</td></tr>';
                return;
            }

            // Sort ascending by join date to get sequential member numbers
            data.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                
                const tierColor = item.tier === 'premier' ? '#d4af37' : 'var(--primary-color)';
                const tierLabel = item.tier === 'premier' ? 'プレミア' : 'レギュラー';
                const memberNo = String(index + 1).padStart(6, '0');
                
                tr.innerHTML = \
                    <td style="padding: 10px;">\<br><span style="color:#888; font-size:0.8rem;">No. \</span></td>
                    <td style="padding: 10px;"><strong>\</strong></td>
                    <td style="padding: 10px;">
                        <span style="color:#aaa;">\</span><br>
                        <span style="font-size: 0.8rem; color:#888;">\</span>
                    </td>
                    <td style="padding: 10px; color:\; font-weight:bold;">\</td>
                    <td style="padding: 10px;"><span style="background:#2ecc71; color:#fff; padding:3px 8px; border-radius:12px; font-size:0.8rem;">有効</span></td>
                    <td style="padding: 10px;">
                        <button class="btn-edit" style="margin-right:5px; padding:3px 8px;" onclick="editMember(\)">編集</button>
                        <button class="btn-delete" style="padding:3px 8px;" onclick="deleteMember(\)">削除</button>
                    </td>
                \;
                tbody.appendChild(tr);
            });
        };

code = code.replace(oldHTML, newHTML);
code = code.replace(oldScript, newScript);
fs.writeFileSync('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/dashboard_lala_7942.html', code);
console.log('Done');
