# classroom-games

課堂音樂遊戲（iPad 適用）。

- `sound-drop/`：Sound Drop 排位賽。錄音來自 VSCO-2 Community Edition（Versilian Studios，CC0）。
- `backend/Code.gs`：Google Apps Script 一次性房間排行榜（部署為網頁應用程式，存取權：所有人）。
- `chord-hunter/`：和弦獵人。三個模式（疊三度／速認和弦／聽和弦），每局 12 題；共用同一個 Apps Script 排行榜（借用後台 stage：terms＝疊三度、fam＝速認、mix＝聽和弦）。鋼琴採樣：tonejs-instruments（CC BY 3.0）。
- `sing-race/`：合唱過關。老師電腦開，用咪量全班聲量；先校準（播伴奏、唔出聲 5 秒），聲量喺綠色範圍內跑手先向前跑；三關：正常 mf、細聲 p、大聲 f（有上限，防止大嗌）。老師設定可調範圍及距離。
