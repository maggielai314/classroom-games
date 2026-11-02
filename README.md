# classroom-games

課堂音樂遊戲（iPad 適用）。

- `sound-drop/`：Sound Drop 排位賽。錄音來自 VSCO-2 Community Edition（Versilian Studios，CC0）。
- `backend/Code.gs`：Google Apps Script 一次性房間排行榜（部署為網頁應用程式，存取權：所有人）。
- `chord-hunter/`：和弦獵人。兩關：第 1 關「砌和弦」（6 題疊三度＋6 題速認）；挑戰關「聽和弦」（C I・F IV・G V・Am vi）。挑戰關開房時由老師機播聲，學生機只作答：① 試聽 → ② 試玩 6 題（唔計分）→ ③ 正式 12 題。老師狀態寫喺排行榜一行特別記錄（pid 以 h0st 開頭），學生機每 2 秒左右讀取。後台 stage：terms／fam＝第 1 關、mix＝挑戰關。鋼琴採樣：tonejs-instruments（CC BY 3.0）。
- `sing-race/`：合唱過關（跑酷）。老師電腦開，用咪聽全班；先校準（播伴奏、唔出聲 5 秒）。聲量喺綠色範圍內而且係「唱」（有穩定音高）時，跑手先跳過障礙物；太細聲、太大聲、亂嗌或講嘢就撞板。三關：mf、p、f。老師設定可調聲量範圍、唱歌偵測虛線（可關）、每關長度。
