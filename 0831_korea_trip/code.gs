function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('韓国 3泊4日 おすすめ旅行モデルコース')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getTripData() {
  return {
    title: "🇰🇷 韓国 3泊4日 おすすめ旅行モデルコース",
    subtitle: "日本人旅行者向け！見どころ・グルメ・おすすめホテル決定版",
    
    // 추천 호텔 정보
    hotels: [
      {
        area: "明洞 (ミョンドン) エリア 【おすすめ度 ⭐️⭐️⭐️⭐️⭐️】",
        desc: "★一番おすすめ！初韓国でも安心。日本語対応スタッフが多く、 買い物や夜市への アクセス抜群。",
        recommends: ["L7 明洞 (L7 Myungdong)", "SOLARIA NISHITETSU HOTEL 明洞", "Nine Tree Premier Hotel 明洞2"]
      },
      {
        area: "弘大 (ホンデ) エリア 【若者・トレンド重視】",
        desc: "空港鉄道(A'REX)一本でアクセス最高。おしゃれなカフェやナイトライフを楽しみたい方に！",
        recommends: ["RYSE, Autograph Collection", "L7 弘大 (L7 Hongdae)"]
      }
    ],

    // 일정 정보
    days: [
      {
        day: "DAY 1",
        title: "ソウル到着 & 伝統と現代が交差する明洞・Nタワー",
        schedules: [
          {
            time: "午後",
            spot: "仁川/金浦空港 到着 ✈️ ＆ ホテルチェックイン",
            desc: "空港鉄道(A'REX)またはリムジンバスで明洞へ移動し、ホテルに荷物を預ける。",
            tags: [{ text: "📍 明洞エリア", type: "sight" }]
          },
          {
            time: "夕方",
            spot: "Nソウルタワー (南山タワー)",
            desc: "ケーブルカーに乗ってタワーへ。ソウル市内を一望できる絶景夜景スポット！",
            tags: [{ text: "👀 絶景・夜景", type: "sight" }]
          },
          {
            time: "夜",
            spot: "明洞屋台街 ＆ ディナー",
            desc: "明洞の賑やかな屋台でチーズタッカルビ、ホットク、トッポギをハシゴ！",
            tags: [{ text: "🍽️ 明洞タッカルビ / 屋台グルメ", type: "food" }]
          }
        ]
      },
      {
        day: "DAY 2",
        title: "韓国のレトロ世界遺産 ＆ トレンド発信地 (安国・聖水)",
        schedules: [
          {
            time: "午前",
            spot: "景福宮 (キョンボックン) ＆ 韓服(ハンボク)体験",
            desc: "チマチョゴリをレンタルして散策！韓服着用で入場料が無料になります。",
            tags: [{ text: "👀 王宮映えスポット", type: "sight" }]
          },
          {
            time: "昼",
            spot: "北村韓屋村 ＆ 三清洞 (サムチョンドン)",
            desc: "伝統的な韓屋が立ち並ぶ街並みを散策。ランチは本場のサムゲタン！",
            tags: [{ text: "🍽️ 土俗村 (トソッチョン) サムゲタン", type: "food" }]
          },
          {
            time: "午後",
            spot: "聖水洞 (ソンスドン) ポップアップ ＆ カフェ巡り",
            desc: "今ソウルで最もホットなエリア！おしゃれな倉庫型カフェやブランドの限定店へ。",
            tags: [{ text: "☕ Onion 聖水 / Bakery Cafe", type: "food" }]
          },
          {
            time: "夜",
            spot: "東大門 (トンデムン) タッカンマリ横丁 ＆ ナイトショッピング",
            desc: "絶品タッカンマリ(鶏一匹鍋)を堪能後、深夜まで開いているショッピングモールへ！",
            tags: [{ text: "🍽️ 陳玉華ハルメ元祖タッカンマリ", type: "food" }]
          }
        ]
      },
      {
        day: "DAY 3",
        title: "若者の街・弘大(ホンデ) ＆ 漢江(ハンガン)ピクニック",
        schedules: [
          {
            time: "午前",
            spot: "延南洞 (ヨンナムドン) ＆ 弘大ウォーク",
            desc: "可愛い雑貨屋や文房具ショップ、セレクトショップを楽しくお買い物。",
            tags: [{ text: "🛍️ ショッピング / 雑貨屋巡り", type: "sight" }]
          },
          {
            time: "昼",
            spot: "弘大でサムギョプサル (豚五花肉) ランチ",
            desc: "ジューシーな熟成肉サムギョプサルと美味しいおかずを堪能！",
            tags: [{ text: "🍽️ 熟成サムギョプサル", type: "food" }]
          },
          {
            time: "午後",
            spot: "汝矣島 (ヨイド) ザ・現代ソウル (The Hyundai Seoul)",
            desc: "ソウル最大級のトレンディな最新ショッピングモールで韓国コスメ＆ファッションチェック。",
            tags: [{ text: "🛍️ K-Beauty & Fashion", type: "sight" }]
          },
          {
            time: "夜",
            spot: "汝矣島 漢江公園 (ハンガンコンウォン)",
            desc: "韓国ドラマでおなじみ！漢江の風を感じながら「チメク(チキン＋ビール)」体験。",
            tags: [
              { text: "👀 漢江夜景", type: "sight" },
              { text: "🍗 韓国フライドチキン (チメク)", type: "food" }
            ]
          }
        ]
      },
      {
        day: "DAY 4",
        title: "K-Beauty ショ핑 ＆ 帰国",
        schedules: [
          {
            time: "午前",
            spot: "オリーブヤング (Olive Young) フラッグシップストア",
            desc: "人気のパック、美容液、韓国コスメを爆買い！免税(Tax Refund)手続きもお忘れなく。",
            tags: [{ text: "🛍️ オリーブヤング大ヒットコスメ", type: "sight" }]
          },
          {
            time: "昼",
            spot: "ラストグルメ！カンジャンケジャン or ソルロンタン",
            desc: "旅の締めくくりに、ワタリガニの醤油漬け(カンジャンケジャン)または優しいスープのソルロンタン。",
            tags: [{ text: "🍽️ カンジャンケジャン / 神仙ソルロンタン", type: "food" }]
          },
          {
            time: "午後",
            spot: "ロッテマートで土産購入 ➔ 空港へ移動 ✈️",
            desc: "韓国のり、薬菓(ヤッカ)、ハニーバターアーモンドを買って空港へ！",
            tags: [{ text: "👋 お土産購入 ＆ 帰国", type: "sight" }]
          }
        ]
      }
    ],

    // 팁 정보
    tips: [
      { title: "🌶️ 辛さの調節", desc: "辛いものが苦手な方は注文時に「アイシメ(辛くしないでください / 辛さ控えめ)」と伝えましょう。" },
      { title: "💳 決済・交通", desc: "韓国は完全キャッシュレス社会です。クレジットカードと、交通カード「WOWPASS」または「NAMANE Card」があるととても便利です。" },
      { title: "🛍️ お土産おすすめ", desc: "韓国のり(高級岩のり)、シーズニングアーモンド、薬菓(ヤッカ)、オリーブヤングのシートマスク、乾燥ワカメが喜ばれます。" }
    ]
  };
}