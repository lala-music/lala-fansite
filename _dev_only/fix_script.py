import re

# 1. Update dashboard_lala_7942.html
with open('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/dashboard_lala_7942.html', 'r', encoding='utf-8') as f:
    admin_text = f.read()

# Fix FC Members tab in Admin
admin_members_ui_search = '''                    <h2>ファンクラブ会員一覧</h2>'''
admin_members_ui_replace = '''                    <h2>ファンクラブ会員一覧 <button class="btn primary-btn" style="float:right; padding: 5px 10px; font-size:0.8rem;" onclick="addMember()">＋ 新規会員追加</button></h2>'''
admin_text = admin_text.replace(admin_members_ui_search, admin_members_ui_replace)

# Fix Diary Form in Admin
admin_diary_form_search = '''                    <div class="form-group">
                        <label>タイトル</label>
                        <input type="text" id="fcDiaryTitle" class="form-control" placeholder="例：最近の曲作りについて">
                    </div>'''
admin_diary_form_replace = '''                    <div class="form-group">
                        <label>タイトル</label>
                        <input type="text" id="fcDiaryTitle" class="form-control" placeholder="例：最近の曲作りについて">
                    </div>
                    <div class="form-group">
                        <label>画像URL (任意)</label>
                        <input type="text" id="fcDiaryMediaUrl" class="form-control" placeholder="例：https://...">
                        <small style="color: #999;">※画像URLを入力するとダイアリーに表示されます。</small>
                    </div>'''
admin_text = admin_text.replace(admin_diary_form_search, admin_diary_form_replace)

# Fix saveFcDiary
save_fc_diary_search = '''        function saveFcDiary() {
            const date = document.getElementById('fcDiaryDate').value;
            const title = document.getElementById('fcDiaryTitle').value;
            const content = document.getElementById('fcDiaryContent').value;
            
            if(!date || !title || !content) {'''
save_fc_diary_replace = '''        function saveFcDiary() {
            const date = document.getElementById('fcDiaryDate').value;
            const title = document.getElementById('fcDiaryTitle').value;
            const content = document.getElementById('fcDiaryContent').value;
            let mediaUrl = document.getElementById('fcDiaryMediaUrl') ? document.getElementById('fcDiaryMediaUrl').value : '';
            
            if(!date || !title || !content) {'''
admin_text = admin_text.replace(save_fc_diary_search, save_fc_diary_replace)

# Fix saveFcDiary update logic
save_fc_diary_update_search = '''                    data[idx] = { id: editingDiaryId, date: date, title: title, content: content };
                }
                editingDiaryId = null;
            } else {
                data.push({ id: Date.now(), date: date, title: title, content: content });
            }'''
save_fc_diary_update_replace = '''                    data[idx] = { id: editingDiaryId, date: date, title: title, content: content, mediaUrl: mediaUrl };
                }
                editingDiaryId = null;
            } else {
                data.push({ id: Date.now(), date: date, title: title, content: content, mediaUrl: mediaUrl });
            }'''
admin_text = admin_text.replace(save_fc_diary_update_search, save_fc_diary_update_replace)

# Fix editDiary
edit_diary_search = '''                document.getElementById('fcDiaryTitle').value = item.title;
                document.getElementById('fcDiaryContent').value = item.content;
                editingDiaryId = id;'''
edit_diary_replace = '''                document.getElementById('fcDiaryTitle').value = item.title;
                document.getElementById('fcDiaryContent').value = item.content;
                if(document.getElementById('fcDiaryMediaUrl')) {
                    document.getElementById('fcDiaryMediaUrl').value = item.mediaUrl || '';
                }
                editingDiaryId = id;'''
admin_text = admin_text.replace(edit_diary_search, edit_diary_replace)

# Fix clear diary form
clear_diary_search = '''            document.getElementById('fcDiaryTitle').value = '';
            document.getElementById('fcDiaryContent').value = '';
            document.querySelector('#tab-fc-diary .btn-submit').textContent = '公開する';'''
clear_diary_replace = '''            document.getElementById('fcDiaryTitle').value = '';
            document.getElementById('fcDiaryContent').value = '';
            if(document.getElementById('fcDiaryMediaUrl')) {
                document.getElementById('fcDiaryMediaUrl').value = '';
            }
            document.querySelector('#tab-fc-diary .btn-submit').textContent = '公開する';'''
admin_text = admin_text.replace(clear_diary_search, clear_diary_replace)

# Fix renderMemberList logic completely with Regex
def replace_member_logic(m):
    return '''        function addMember() {
            const name = prompt('会員のお名前を入力してください:');
            if(!name) return;
            const email = prompt('メールアドレスを入力してください:', 'user@example.com');
            const tier = confirm('プレミア会員として登録しますか？(OK=プレミア, キャンセル=レギュラー)') ? 'premier' : 'monthly';
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
            const tier = confirm('プレミア会員ですか？(OK=プレミア, キャンセル=レギュラー)') ? 'premier' : 'monthly';
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
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">登録されている会員はありません。</td></tr>';
                return;
            }

            // Sort by joinDate ascending so we can assign member numbers properly
            data.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                
                const tierColor = item.tier === 'premier' ? '#d4af37' : 'var(--primary-color)';
                const tierLabel = item.tier === 'premier' ? 'プレミア' : 'レギュラー';
                const memberNo = String(index + 1).padStart(6, '0');
                
                tr.innerHTML = `
                    <td style="padding: 10px;">${item.joinDate}<br><span style="font-size:0.8rem; color:#888;">No. ${memberNo}</span></td>
                    <td style="padding: 10px;"><strong>${item.name}</strong></td>
                    <td style="padding: 10px;">${item.email}</td>
                    <td style="padding: 10px;"><span style="background:${tierColor}; color:#000; padding:3px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">${tierLabel}</span></td>
                    <td style="padding: 10px;"><span style="color:#4caf50;">有効</span></td>
                    <td style="padding: 10px;">
                        <button class="btn-edit" style="margin-right:5px; padding:3px 8px;" onclick="editMember(${item.id})">編集</button>
                        <button class="btn-delete" style="padding:3px 8px;" onclick="deleteMember(${item.id})">削除</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }'''

admin_text = re.sub(r'        function renderMemberList\(\) \{.*?(?=        function deleteMember)', replace_member_logic, admin_text, flags=re.DOTALL)

with open('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/dashboard_lala_7942.html', 'w', encoding='utf-8') as f:
    f.write(admin_text)

print('Updated dashboard_lala_7942.html')

# 2. Update fanclub-dashboard.html
with open('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/fanclub-dashboard.html', 'r', encoding='utf-8') as f:
    fc_text = f.read()

# Add diaryModalMedia placeholder
diary_modal_search = '''            <div id="diaryModalDate" style="color:var(--primary-color); font-weight:bold; margin-bottom:10px; font-size:0.9rem;"></div>
            <h2 id="diaryModalTitle" style="margin-bottom:20px; font-size:1.4rem;"></h2>
            <div id="diaryModalContent" style="line-height:1.8; white-space:pre-wrap; font-size:0.95rem;"></div>'''
diary_modal_replace = '''            <div id="diaryModalDate" style="color:var(--primary-color); font-weight:bold; margin-bottom:10px; font-size:0.9rem;"></div>
            <h2 id="diaryModalTitle" style="margin-bottom:20px; font-size:1.4rem;"></h2>
            <div id="diaryModalMedia" style="display:none; text-align:center; margin-bottom:20px;"></div>
            <div id="diaryModalContent" style="line-height:1.8; white-space:pre-wrap; font-size:0.95rem;"></div>'''
fc_text = fc_text.replace(diary_modal_search, diary_modal_replace)

# Update openDiaryModal JS
open_diary_search = '''                document.getElementById('diaryModalDate').innerText = item.date.replace(/-/g, '.');
                document.getElementById('diaryModalTitle').innerText = item.title;
                document.getElementById('diaryModalContent').innerText = item.content || '';
                document.getElementById('diaryModal').style.display = 'flex';'''
open_diary_replace = '''                document.getElementById('diaryModalDate').innerText = item.date.replace(/-/g, '.');
                document.getElementById('diaryModalTitle').innerText = item.title;
                document.getElementById('diaryModalContent').innerText = item.content || '';
                
                const mediaContainer = document.getElementById('diaryModalMedia');
                if(mediaContainer) {
                    if(item.mediaUrl) {
                        mediaContainer.innerHTML = `<img src="${item.mediaUrl}" style="max-width:100%; max-height:400px; border-radius:8px;">`;
                        mediaContainer.style.display = 'block';
                    } else {
                        mediaContainer.style.display = 'none';
                        mediaContainer.innerHTML = '';
                    }
                }
                
                document.getElementById('diaryModal').style.display = 'flex';'''
fc_text = fc_text.replace(open_diary_search, open_diary_replace)

# Update member number display to use index if possible. 
apply_tier_ui_search = '''            let memberNo = "008192";
            let memberName = "LALA FAN 様";
            if(currentUserStr) {
                const u = JSON.parse(currentUserStr);
                // Extract last 6 digits of timestamp ID as member number
                memberNo = String(u.id).slice(-6);
                memberName = u.name + " 様";
            }'''
apply_tier_ui_replace = '''            let memberNo = "008192";
            let memberName = "LALA FAN 様";
            if(currentUserStr) {
                const u = JSON.parse(currentUserStr);
                const allMembers = JSON.parse(localStorage.getItem('lala_fc_members')) || [];
                // Find member index
                allMembers.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate));
                const memberIndex = allMembers.findIndex(m => m.id === u.id);
                if (memberIndex !== -1) {
                    memberNo = String(memberIndex + 1).padStart(6, '0');
                } else {
                    memberNo = String(u.id).slice(-6);
                }
                memberName = u.name + " 様";
            }'''
fc_text = fc_text.replace(apply_tier_ui_search, apply_tier_ui_replace)

with open('c:/Users/user/.gemini/antigravity/scratch/lala-fansite/fanclub-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(fc_text)
print('Updated fanclub-dashboard.html')
