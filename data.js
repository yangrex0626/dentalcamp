/* ============================================================
   臨床資料重建行動 — 內容資料檔
   ============================================================ */

const CAMP_NAME = "國防醫學大學 口腔醫學營";
const COURSE_NAME = "思維挑戰";
const SIGNATORY_NAME = "Yang Chen Hsin";
const LOGO_SRC = "assets/dental-camp-logo.jpg";
const FEEDBACK_EMAIL = "rexyang2005@gmail.com"; // 測試回饋預設寄送對象，需要的話直接改這裡

/* ---------- EmailJS（自動回報測試結果用）----------
   到 https://www.emailjs.com/ 申請免費帳號後，把下面三個值換成你自己的：
   1. Email Services → Add New Service → 連接 Gmail → 複製 Service ID
   2. Email Templates → Create New Template → To Email 填 FEEDBACK_EMAIL，
      內文隨意用 {{team_name}} 和 {{message}} 兩個變數 → 複製 Template ID
   3. Account → General → 複製 Public Key
   三個值都還是 "YOUR_..." 的話，系統會自動略過自動回報，只保留手動複製/寄信按鈕。
------------------------------------------------------------------- */
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";

/* ---------- 證書印章（使用營隊官方 Logo） ---------- */
const CERT_SEAL_SVG = `<img class="cert-seal" src="${LOGO_SRC}" alt="${CAMP_NAME} Logo">`;

const BRIEFING_TEXT = `
你是教學醫院口腔顎面部門新成立的「臨床資料重建小組」成員。<br><br>
三天前，醫院病歷系統發生資料損毀，一名代號 <strong>A19</strong> 的高三病患，其完整病歷幾乎全部遺失，
只搶救出九份分散、格式混亂的原始記錄與檢驗數據，橫跨從嬰幼兒發育、牙齒型態、組織構造、解剖位置，
到蛀牙成因、牙周狀況、飲食風險、修復材料選擇，以及一次外傷處置記錄。這名病患在半年內，口腔狀況急速惡化。<br><br>
院方委託你們小組，重建出完整的診斷報告，藉此釐清 A19 口腔狀況急速惡化的真正原因。這是一項思維挑戰，不求快，只求每一步推理都經得起檢驗。<br><br>
每重建出一份證物的關鍵代碼，請在下方對應欄位輸入驗證。驗證成功後，系統會釋出下一段劇情與下一份證物。
`;

const CONVENTIONS_TEXT = `
<p>資料重建系統殘留了一份操作慣例說明，接下來九份證物都會用到，先讀懂它：</p>
<ul>
  <li>凡是牽涉「英文名稱」的線索，通常要換算成它在 26 個字母表中的<strong>序位</strong>（A=1, B=2 … Z=26）。</li>
  <li>找到多個數字時，系統預設會將它們<strong>加總</strong>成一個驗證碼，除非證物內容另有指示（例如排序、串接）。</li>
  <li>每份證物的輸入框數量，就是這份證物需要你找出的數字個數——不會多也不會少。</li>
</ul>
<p>接下來的九份證物，只會給你原始資料和背景知識，不會再重複說明怎麼算——請自己判斷該套用哪一條慣例。</p>
`;

/* ---------- Stephan 曲線資料模型（用於證物⑤即時繪圖） ---------- */
const STEPHAN_ANCHORS = [
  [0, 7.0], [3, 5.5], [5, 5.0], [10, 5.0], [15, 5.1],
  [20, 5.3], [24, 5.5], [27, 6.0], [32, 7.0]
];
const STEPHAN_FEED_STARTS = [0, 20, 40];
const STEPHAN_DOMAIN_END = 75;

function stephanSingleCurve(r) {
  if (r < 0) return null;
  if (r >= 32) return 7.0;
  for (let i = 0; i < STEPHAN_ANCHORS.length - 1; i++) {
    const [x0, y0] = STEPHAN_ANCHORS[i];
    const [x1, y1] = STEPHAN_ANCHORS[i + 1];
    if (r >= x0 && r <= x1) {
      const t = (r - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return 7.0;
}

function stephanEnvelopeAt(t) {
  let minVal = Infinity;
  for (const s of STEPHAN_FEED_STARTS) {
    if (t >= s) {
      const v = stephanSingleCurve(t - s);
      if (v !== null && v < minVal) minVal = v;
    }
  }
  return minVal === Infinity ? 7.0 : minVal;
}

/* ============================================================
   九關資料
   ============================================================ */
const STAGES = [
  {
    id: 1,
    code: "①",
    title: "發育卷宗",
    subject: "口腔胚胎組織學",
    intro: "搶救出的第一份資料，是 A19 幼年時期的牙齒發育卷宗，記載著牙胚構造與萌發時序，但關鍵數字已被系統打散。",
    background: `
      <p>牙齒並不是一次長成的，而是從胚胎時期開始，經過一連串的發育過程。牙胚由三個部分組成，各自發育成不同的組織：</p>
      <ul>
        <li><strong>成釉器</strong>（enamel organ）→ 內含成釉細胞，發育成<strong>琺瑯質（Enamel）</strong>，是全身最硬的組織。</li>
        <li><strong>牙乳頭</strong>（dental papilla）→ 內含成牙本質細胞，發育成<strong>牙本質（Dentin）</strong>——礦化的硬組織，
        以及<strong>牙髓（Pulp）</strong>——含血管與神經、幾乎不含礦物質的軟組織。</li>
        <li><strong>牙囊</strong>（dental follicle）→ 發育成<strong>牙骨質（Cementum）</strong>——包覆牙根表面的礦化硬組織、
        <strong>牙周韌帶（Periodontal ligament）</strong>——連接牙根與齒槽骨的軟組織，以及<strong>齒槽骨（Alveolar bone）</strong>——
        雖然也是硬組織，但它屬於顎骨系統的一部分，並不算「牙齒本身」的組織。</li>
      </ul>
      <p>琺瑯質、牙本質、牙髓、牙骨質是公認的「四大牙齒組織」。</p>
      <p>牙齒的萌發也有固定的時序：乳牙約從出生後 6 個月開始萌發，全部 20 顆約在 2–3 歲長齊；恆牙則從 6 歲左右開始萌發，
      其中<strong>第一恆臼齒（俗稱六歲齒）</strong>通常是最早萌發的恆牙，且萌發位置在乳牙後方，不需要換牙就直接長出。</p>
    `,
    task: `
      <p>找出三種胚胎構造最終發育成的「主要組織」——成釉器 → ？　牙乳頭 → ？（取主要負責硬組織形成者）　牙囊 → ？（取最主要的硬組織）。
      這三個組織的英文名稱，會給你第一個數字需要的線索。</p>
      <p>將下列 8 顆牙齒依萌發年齡「由小到大」重新排序：乳第二大臼齒（約26個月）、第一恆臼齒／六歲齒（約6歲）、
      乳犬齒（約18個月）、第三大臼齒／智齒（約18歲）、下顎乳中門齒（約6個月）、第二恆臼齒／十二歲齒（約12歲）、
      乳第一大臼齒（約14個月）、下顎恆中門齒（約6.5歲）。背景知識中特別點名的那顆牙，在排序中的位置，會給你第二個數字。</p>
    `,
    format: "pair",
    inputLabels: ["驗證碼（一）", "驗證碼（二）"],
    answer: ["12", "5"],
    hints: [
      "三個胚胎構造分別對應哪一種硬組織？先寫出它們的英文名稱。",
      "背景知識裡提過，慣例上英文名稱要換算成什麼？三個組織名稱的開頭字母，各自是字母表中第幾位？",
      "六歲齒的萌發年齡是幾歲？在全部 8 個項目由小到大排列後，它排第幾個？"
    ],
    story: `
      發育卷宗解密成功。系統釋出一行手寫註記：<br>
      <em>「……A19 的第一恆臼齒（六歲齒）萌發後，未曾接受完整窩溝封填，該齒後續反覆出現症狀。」</em><br>
      這份卷宗只證實了 A19 的發育歷程正常——問題，是從後面才開始的。下一份證物正在解鎖：<strong>型態鑑定</strong>。
    `
  },
  {
    id: 2,
    code: "②",
    title: "型態鑑定",
    subject: "牙體型態學",
    intro: "第二份資料是牙體型態鑑定報告，描述了幾顆特徵明顯的牙齒，但牙位編號欄位全數毀損。",
    background: `
      <p>牙齒可依型態與功能分成四大類：</p>
      <ul>
        <li><strong>門齒（切齒，Incisor）</strong>：切端呈鑿狀，單根，負責切斷食物；下顎的中門齒通常是恆牙中最早萌發的門齒，比同側的側門齒更早長出</li>
        <li><strong>犬齒（Canine）</strong>：牙尖尖銳呈單一尖峰，牙根是全口最長的，負責撕裂食物</li>
        <li><strong>小臼齒（Premolar）</strong>：咬合面通常有 2 個咬頭，介於犬齒與大臼齒之間</li>
        <li><strong>大臼齒（Molar）</strong>：咬合面咬頭數最多（4–5 個），負責磨碎食物，第一大臼齒（六歲齒）通常是恆牙中最早萌發、體積最大的臼齒</li>
      </ul>
      <p>牙醫界常用 <strong>FDI 兩位數編號系統</strong>（FDI World Dental Federation Notation，國際牙科聯盟標示法）標示牙位：
      第一位數字代表「象限」，第二位數字代表「從正中線數來的牙位」。</p>
      <p><strong>象限（恆牙）</strong>：1=右上、2=左上、3=左下、4=右下　　<strong>牙位</strong>：1=中門齒、2=側門齒、3=犬齒、4=第一小臼齒、5=第二小臼齒、6=第一大臼齒、7=第二大臼齒、8=第三大臼齒（智齒）</p>
      <p>例如：右上顎的犬齒 → 象限1、牙位3 → FDI 代碼 <strong>13</strong></p>
    `,
    task: `
      <p>判斷以下四段「特徵描述」各自是哪一顆牙齒，並寫出其 FDI 兩位數代碼：</p>
      <ol>
        <li>右上顎、牙根是全口最長且單一的一根、牙尖尖銳呈現單一大尖峰、負責撕裂食物</li>
        <li>左下顎、咬合面有 5 個咬頭並呈現 Y 形溝紋、是恆牙中最早萌發的臼齒</li>
        <li>右下顎、切端呈鑿狀、單根、負責切斷食物、是恆牙中最早萌發的門齒</li>
        <li>左上顎、咬合面有 2 個咬頭、介於犬齒與大臼齒之間</li>
      </ol>
      <p>四個 FDI 代碼各自由兩個有意義的數字組成。把四個代碼裡「同一種意義」的數字分別加總，會得到你需要的兩個驗證碼。</p>
    `,
    format: "pair",
    inputLabels: ["驗證碼（一）", "驗證碼（二）"],
    answer: ["10", "14"],
    hints: [
      "先判斷每段描述是門齒、犬齒、小臼齒還是大臼齒，再對照象限描述寫出四個 FDI 代碼。",
      "FDI 代碼十位數是象限（左右上下），個位數是從正中線數來的牙位——兩種數字各自代表不同意義。",
      "四個代碼，十位數加起來一組，個位數加起來另一組。"
    ],
    story: `
      型態鑑定比對完成，四顆牙齒的位置被準確標出。報告邊緣有一行紅字批註：<br>
      <em>「其中一顆恆牙——右上中門齒——半年前有過外傷紀錄，需另行追蹤。」</em><br>
      這條線索先記下來，繼續往下追。下一份證物正在解鎖：<strong>組織密碼</strong>。
    `
  },
  {
    id: 3,
    code: "③",
    title: "組織密碼",
    subject: "牙體組織學（已加密）",
    intro: "第三份資料是一份組織成分分析報告，數據完整，但組織名稱欄位全部遺失，只留下代號 A–E，且尾端夾帶一段加密訊息。",
    background: `
      <p>牙齒由外到內主要分為三層硬組織與一層軟組織，外側則有支持組織：</p>
      <ul>
        <li><strong>琺瑯質（Enamel）</strong>：人體最堅硬的組織，幾乎全由無機礦物質構成，無血管神經。</li>
        <li><strong>牙本質（Dentin）</strong>：位於琺瑯質內側，礦物質含量次之，內部有牙本質小管，可傳導冷熱刺激。</li>
        <li><strong>牙髓（Pulp）</strong>：牙齒中心的軟組織，含血管與神經，幾乎不含礦物質。</li>
        <li><strong>牙骨質（Cementum）</strong>：包覆牙根表面，讓牙周韌帶纖維附著，礦物質含量介於牙本質與軟組織之間。</li>
        <li><strong>牙周韌帶（Periodontal ligament）</strong>：連接牙根與齒槽骨的緻密結締組織，主要由膠原纖維構成，礦物質含量趨近於零。</li>
      </ul>
      <p>以上五種才是公認的「牙齒相關組織」。<strong>齒槽骨（Alveolar bone）</strong>雖然礦物質含量也不低，但它屬於顎骨系統的一部分，
      並不算牙齒本身或牙周的組織——切片檢體在採樣過程中，有時會不小心混入周邊齒槽骨的碎屑，判讀時需要特別留意排除。</p>
    `,
    task: `
      <table class="data-table">
        <thead><tr><th>代號</th><th>無機質比例</th><th>有機質比例</th><th>水分比例</th></tr></thead>
        <tbody>
          <tr><td>A</td><td>趨近 0%</td><td>32%</td><td>68%</td></tr>
          <tr><td>B</td><td>96%</td><td>1%</td><td>3%</td></tr>
          <tr><td>C</td><td>趨近 0%</td><td>25%</td><td>75%</td></tr>
          <tr><td>D</td><td>70%</td><td>20%</td><td>10%</td></tr>
          <tr><td>E</td><td>45%</td><td>33%</td><td>22%</td></tr>
          <tr><td>F</td><td>60%</td><td>25%</td><td>15%</td></tr>
        </tbody>
      </table>
      <p>依成分比例判斷 A–F 分別對應哪一種組織——六個代號中，有一個其實不屬於「牙齒本身」的組織，必須依照背景知識的分類方式排除，
      不能只看數字大小。排除之後，剩下的組織裡有三種硬組織呈現明顯的礦物質梯度，請依無機質比例由高到低排序。
      將這三個代號依排序結果換算成字母表順序（A=1…F=6），組成三個數字，作為以下密文的<strong>逐字位移金鑰</strong>
      （第一個字母位移第一個數字，依序循環；空格與符號不位移、不佔金鑰順序）：</p>
      <div class="cipher-block">PICV IAKHJPGJ NSHM GTFI NU WJXIS QRJ GMLJX KQYW</div>
      <p>解密後的訊息會用英文單字拼出一組四位數密碼（例如訊息中出現 "THREE NINE ZERO SIX"，代表密碼是 3906）。</p>
    `,
    format: "single",
    inputLabels: ["解密出的四位數密碼"],
    answer: ["7184"],
    hints: [
      "先確認 A–F 誰是硬組織、誰是軟組織——別忘了背景知識提到，有一個代號其實不算牙齒本身的組織。",
      "排除掉那個不屬於牙齒本身的代號後，剩下的組織裡有三種呈現明顯的礦物質梯度，把它們依比例由高到低排序。",
      "把排序後的三個組織代號，換算成字母在 26 個字母表中的順序，那就是金鑰的三個數字。",
      "密文裡沒有藏數字，答案是解密後、用英文單字拼出來的數字。"
    ],
    story: `
      密文解開：<em>「NEXT EVIDENCE LOCK CODE IS SEVEN ONE EIGHT FOUR」</em>。組織密碼破解成功，
      同時也證實了一件事——A19 的牙本質層在檢體中已出現明顯脫礦跡象，並非單純表面問題。<br>
      下一份證物正在解鎖：<strong>解剖定位</strong>。
    `
  },
  {
    id: 4,
    code: "④",
    title: "解剖定位",
    subject: "口腔解剖學",
    intro: "第四份資料記錄了 A19 主訴的「咀嚼時疼痛、張口有雜音」，附上一張功能構造配對表，構造名稱已被抹除。",
    background: `
      <p>咀嚼時實際出力的肌肉稱為「咀嚼肌」（Muscles of mastication），主要有四塊：顳肌（Temporalis）、咬肌（Masseter）、
      翼內肌（Medial pterygoid）、翼外肌（Lateral pterygoid），它們與下頜骨、顳骨共同構成顳顎關節（TMJ, Temporomandibular joint），是下頜運動的樞紐。</p>
      <p>支配臉部與口腔感覺的主要神經是三叉神經（Trigeminal nerve），分成三大分支：眼分支（V1，管額頭眼周）、上頜分支（V2，管上排牙齒與上顎）、
      下頜分支（V3，是唯一同時具有感覺與運動功能的分支，負責下排牙齒感覺，也支配所有咀嚼肌的運動）。</p>
    `,
    task: `
      <table class="data-table">
        <thead><tr><th>代號</th><th>臨床／解剖觀察紀錄</th></tr></thead>
        <tbody>
          <tr><td>A</td><td>起自顳窩，止於下頜骨冠突，收縮時可使下顎向後、向上移動</td></tr>
          <tr><td>B</td><td>起自顴弓，止於下頜角外側，是頭頸部收縮力量最強的肌肉之一，能使下顎閉合</td></tr>
          <tr><td>C</td><td>與另一塊肌肉合力形成類似吊帶的構造，牽引下頜骨向上</td></tr>
          <tr><td>D</td><td>收縮時會使下巴向前移動，是這群肌肉中唯一在張口動作時會發揮作用的一塊</td></tr>
          <tr><td>E</td><td>位於下頜骨與顳骨之間，是咀嚼運動時所有動作的支點</td></tr>
          <tr><td>F</td><td>受損時，病患額頭與眼周皮膚會失去痛覺，但咬合力量不受影響</td></tr>
          <tr><td>G</td><td>受損時，病患上排牙齒麻醉、失去知覺，但講話、咀嚼的力量仍然正常</td></tr>
          <tr><td>H</td><td>受損時，病患下排牙齒失去知覺，同時咀嚼肌也無法正常收縮出力</td></tr>
        </tbody>
      </table>
      <p>從八個代號的觀察紀錄中，你能判斷出哪幾個是咀嚼肌、哪一個神經分支比較特殊嗎？找出它們，就能得到兩個驗證碼。</p>
    `,
    format: "pair",
    inputLabels: ["驗證碼（一）", "驗證碼（二）"],
    answer: ["10", "8"],
    hints: [
      "咀嚼肌一共有四塊，不包含關節和神經。",
      "三叉神經三個分支裡，只有一個同時管感覺又管運動，且是負責下排牙齒。",
      "找到代號後，換算成字母序位——咀嚼肌的幾個代號要加總，神經分支的代號本身就是答案。"
    ],
    story: `
      解剖定位完成，症狀來源明確：反覆的咀嚼疼痛與 TMJ 雜音，指向長期咬合負擔異常。<br>
      這份資料附了一句醫囑：<em>「建議搭配飲食紀錄評估致病機轉。」</em><br>
      下一份證物正在解鎖：<strong>化學動力學</strong>。
    `
  },
  {
    id: 5,
    code: "⑤",
    title: "化學動力學",
    subject: "口腔生物化學（Stephan 曲線）",
    intro: "第五份資料是儀器直接輸出的圖表：A19 在某天內吃了 3 次點心後，牙菌斑 pH 值隨時間變化的記錄。",
    background: `
      <p>口腔中的細菌（主要是變形鏈球菌）會代謝食物中的可發酵醣類（尤其是蔗糖），透過醣解作用產生乳酸，使牙菌斑的 pH 值快速下降。
      當 pH 降到 <strong>5.5（臨界 pH）以下</strong>時，琺瑯質的礦物質就會開始溶出（脫礦）；等唾液的緩衝作用讓 pH 回升到 5.5 以上，
      脫礦才會停止，甚至逆轉為再礦化。這種「進食後 pH 先急速下降、再緩慢回升」的曲線稱為 <strong>Stephan 曲線</strong>。</p>
      <p>臨床上有一個重要觀念：<strong>進食「頻率」比進食「總量」更關鍵</strong>——因為每一次進食都會重新觸發一次脫礦期，
      如果兩次進食間隔太短，牙齒可能連完整恢復的機會都沒有。根據臨床觀察，單次進食後，牙菌斑 pH 大約在進食後第 3 分鐘開始降到臨界值以下，
      若沒有再進食干擾，大約在進食後第 24 分鐘就能完全恢復到 5.5 以上。</p>
    `,
    task: `
      <p>下圖為 A19 在第 0、20、40 分鐘各吃一次點心後，儀器記錄下的牙菌斑 pH 變化曲線。紅色虛線代表臨界 pH = 5.5。</p>
      <div id="stephan-chart-container" class="chart-container"></div>
      <p>判讀圖表，找出整段觀察期間內，pH 值「連續低於 5.5」的起始與結束時間點，算出總共處於脫礦危險狀態的分鐘數，這是第一個驗證碼。</p>
      <p>假設把這 3 次點心改成「一次全部吃完」，只會觸發一次 Stephan 曲線。請根據背景知識中單次進食的 pH 變化時間，
      計算這種情況下脫礦危險的時間會是幾分鐘，作為第二個驗證碼。</p>
    `,
    format: "pair",
    inputLabels: ["驗證碼（一）", "驗證碼（二）"],
    answer: ["61", "21"],
    hints: [
      "先找出圖上紅色虛線以下、連續不中斷的整段區間。",
      "起點大約在第 3 分鐘，終點是曲線真正回到 5.5 以上的那一刻。",
      "三次點心的間隔比每次恢復所需的時間短，三段危險期其實是連在一起的。",
      "只吃一次的話，危險期就是背景知識提到的『開始下降』到『完全恢復』這段時間，兩個時間點相減就是答案。"
    ],
    story: `
      化學動力學分析完成：三段脫礦期首尾相連，形成一段長達一小時的連續酸襲擊。<br>
      飲食紀錄附註寫著：<em>「A19 習慣少量多餐、頻繁攝取含糖點心。」</em>——頻率，才是真正的關鍵字。<br>
      下一份證物正在解鎖：<strong>探測診斷</strong>。
    `
  },
  {
    id: 6,
    code: "⑥",
    title: "探測診斷",
    subject: "牙周病學",
    intro: "第六份資料是牙周探測記錄表，三顆牙齒各有六個測量點的深度、出血與附連組織喪失數據。",
    background: `
      <p>牙周探測深度（Probing Depth）是牙醫用探針測量牙齦溝／牙周囊袋深度的臨床指標：</p>
      <ul>
        <li><strong>健康（Healthy）</strong>：探測深度 &lt; 3mm，探測不出血</li>
        <li><strong>齦炎（Gingivitis）</strong>：探測深度 3–4mm，探測容易出血，但<strong>沒有</strong>齒槽骨與附連組織的破壞（可逆狀態）</li>
        <li><strong>牙周炎（Periodontitis）</strong>：探測深度 ≥ 4mm，且合併<strong>附連組織喪失（Attachment loss）</strong>，屬於不可逆的破壞</li>
      </ul>
    `,
    task: `
      <p><strong>牙齒①（上顎右側第一大臼齒）</strong></p>
      <table class="data-table"><thead><tr><th>測量點</th><th>近頰</th><th>頰側</th><th>遠頰</th><th>近舌</th><th>舌側</th><th>遠舌</th></tr></thead>
      <tbody><tr><td>深度(mm)</td><td>5</td><td>4</td><td>6</td><td>5</td><td>4</td><td>5</td></tr>
      <tr><td>出血</td><td colspan="6">全部有</td></tr><tr><td>附連組織喪失</td><td colspan="6">全部有</td></tr></tbody></table>
      <p><strong>牙齒②（下顎左側門牙）</strong></p>
      <table class="data-table"><thead><tr><th>測量點</th><th>近頰</th><th>頰側</th><th>遠頰</th><th>近舌</th><th>舌側</th><th>遠舌</th></tr></thead>
      <tbody><tr><td>深度(mm)</td><td>3</td><td>4</td><td>3</td><td>4</td><td>3</td><td>4</td></tr>
      <tr><td>出血</td><td colspan="6">全部有</td></tr><tr><td>附連組織喪失</td><td colspan="6">全部無</td></tr></tbody></table>
      <p><strong>牙齒③（下顎右側第二大臼齒）</strong></p>
      <table class="data-table"><thead><tr><th>測量點</th><th>近頰</th><th>頰側</th><th>遠頰</th><th>近舌</th><th>舌側</th><th>遠舌</th></tr></thead>
      <tbody><tr><td>深度(mm)</td><td>4</td><td>5</td><td>6</td><td>5</td><td>4</td><td>6</td></tr>
      <tr><td>出血</td><td colspan="6">全部有</td></tr><tr><td>附連組織喪失</td><td colspan="6">全部有</td></tr></tbody></table>
      <p>依照背景知識的判定標準，判斷牙齒①②③各自屬於「健康／齦炎／牙周炎」，再依照下列規則算出兩個驗證碼：</p>
      <p><strong>驗證碼（一）</strong>：把所有被判定為「牙周炎」的牙齒，各自的六個測量點數量加總起來
      （例如：如果有兩顆牙都被判定為牙周炎，就是 6 + 6 = 12；如果只有一顆，就是 6）。</p>
      <p><strong>驗證碼（二）</strong>：把所有被判定為「牙周炎」的牙齒的編號（①視為 1、②視為 2、③視為 3）加總起來。</p>
      <p>下方是非題可以幫你確認判斷邏輯是否正確。</p>
      <div class="quiz-block">
        <p><strong>迷思是非題</strong>（協助確認你的判斷邏輯）：</p>
        <ol>
          <li>用力刷牙、刷越大力才會清得越乾淨。</li>
          <li>含氟牙膏可以幫助琺瑯質再礦化。</li>
          <li>牙結石只要每天認真刷牙，就可以自己刷掉。</li>
          <li>漱口水可以完全取代刷牙與牙線的清潔效果。</li>
          <li>牙間刷或牙線是清潔牙縫、預防牙周病的重要工具。</li>
          <li>牙齦流血是正常現象，不需要特別理會。</li>
        </ol>
      </div>
    `,
    format: "pair",
    inputLabels: ["驗證碼（一）", "驗證碼（二）"],
    answer: ["12", "4"],
    hints: [
      "先把每顆牙的判定結果寫出來：健康／齦炎／牙周炎。",
      "只有牙周炎屬於不可逆的破壞，健康和齦炎都不算。第一個驗證碼和「不可逆」那個等級的測量點數量有關。",
      "把「不可逆」的牙齒各自在①②③序列中的號碼找出來，加起來就是第二個驗證碼。"
    ],
    story: `
      探測診斷確認：兩顆臼齒已進入不可逆的牙周破壞階段。報告末端有一行紅字：<br>
      <em>「附連組織喪失無法逆轉，唯一能做的是阻止惡化——但這需要從飲食源頭著手。」</em><br>
      下一份證物正在解鎖：<strong>飲食日記</strong>。
    `
  },
  {
    id: 7,
    code: "⑦",
    title: "飲食日記",
    subject: "化學（pH 計算）",
    intro: "第七份資料是 A19 的飲食日記化驗附錄，列出六項常見飲品的氫離子濃度，pH 欄位全數空白。",
    background: `
      <p>牙齒琺瑯質開始脫礦的臨界 pH 約為 <strong>5.5</strong>。飲料或食物的酸鹼度可以用其中的氫離子濃度 [H⁺] 換算：</p>
      <p class="formula">pH = −log₁₀[H⁺]</p>
      <p>例如某飲品的 [H⁺] 為 10⁻².⁵ mol/L，代入公式後 pH 約為 2.5，屬於高風險（強酸）飲品。</p>
    `,
    task: `
      <table class="data-table">
        <thead><tr><th>編號</th><th>品項</th><th>[H⁺] (mol/L)</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>可樂</td><td>10⁻².⁵</td></tr>
          <tr><td>2</td><td>柳橙汁</td><td>10⁻³.⁵</td></tr>
          <tr><td>3</td><td>運動飲料</td><td>10⁻³</td></tr>
          <tr><td>4</td><td>黑咖啡</td><td>10⁻⁵</td></tr>
          <tr><td>5</td><td>牛奶</td><td>10⁻⁶.⁵</td></tr>
          <tr><td>6</td><td>開水</td><td>10⁻⁷</td></tr>
        </tbody>
      </table>
      <p>算出每一項飲品的 pH 值，篩出真正屬於「高風險」的品項，再依酸性強弱排出順序，把編號依序串接成一組密碼（需準備計算機）。</p>
    `,
    format: "single",
    inputLabels: ["驗證碼"],
    answer: ["1324"],
    hints: [
      "pH = −log[H⁺]，10 的負幾次方，pH 就是那個數字。",
      "先挑出 pH 小於 5.5 的品項。",
      "酸性最強（pH 最小）的排最前面。"
    ],
    story: `
      飲食日記解密完成：可樂、運動飲料、柳橙汁、黑咖啡都是 A19 的日常飲品清單常客。<br>
      這與化學動力學報告的「高頻率酸襲擊」互相印證。下一份證物正在解鎖：<strong>材料選擇</strong>。
    `
  },
  {
    id: 8,
    code: "⑧",
    title: "材料選擇",
    subject: "牙科材料學",
    intro: "第八份資料是修復材料選用紀錄，牙醫團隊曾針對三種臨床情境挑選材料，選用代號被打亂。",
    background: `
      <p>常見的牙科修復材料各有優缺點：</p>
      <ul>
        <li><strong>複合樹脂（Composite resin）</strong>：與牙齒顏色相近、美觀度高，需酸蝕與黏合劑黏著，適合前牙美觀修復，耐磨耗度中等。</li>
        <li><strong>銀汞合金（Amalgam）</strong>：耐用、抗壓強度高、價格便宜，但顏色為銀灰色不美觀，現今臨床使用已逐漸減少。</li>
        <li><strong>牙科陶瓷（Dental ceramic）</strong>：美觀度最高、生物相容性佳，但材質偏脆、價格較高，多用於牙冠、貼片等修復。</li>
        <li><strong>玻璃離子水門汀（Glass ionomer cement, GIC）</strong>：可持續釋放氟離子、有助預防蛀牙，但機械強度較弱，常用於乳牙或暫時性填補。</li>
      </ul>
    `,
    task: `
      <table class="data-table">
        <thead><tr><th>代號</th><th>美觀度</th><th>抗壓強度</th><th>耐磨耗</th><th>釋氟能力</th><th>價格</th></tr></thead>
        <tbody>
          <tr><td>①</td><td>5</td><td>3</td><td>3</td><td>0</td><td>4</td></tr>
          <tr><td>②</td><td>1</td><td>5</td><td>5</td><td>0</td><td>1</td></tr>
          <tr><td>③</td><td>5</td><td>2</td><td>2</td><td>0</td><td>5</td></tr>
          <tr><td>④</td><td>2</td><td>2</td><td>2</td><td>5</td><td>2</td></tr>
        </tbody>
      </table>
      <p>（價格 1 分＝最便宜，5 分＝最昂貴）</p>
      <p><strong>情境一</strong>：幫小朋友的乳牙窩溝做預防性填補，希望材料能持續釋放氟離子保護牙齒。</p>
      <p><strong>情境二</strong>：病患後牙咬合面有大範圍蛀牙，需要能承受高咬合力的材料，美觀不是首要考量，且預算有限。</p>
      <p><strong>情境三</strong>：病患希望修復前牙的蛀牙，同時兼顧美觀與自然齒色（僅為補牙，非牙冠或貼片）。</p>
      <p>依「情境一、情境二、情境三」的順序，把選出的材料代號依序串接成密碼。</p>
    `,
    format: "single",
    inputLabels: ["驗證碼"],
    answer: ["421"],
    hints: [
      "情境一要釋氟，四種材料裡只有一種有釋氟能力。",
      "情境二不重美觀、要耐用、要便宜，是哪一種？",
      "情境三是『補牙』不是『做牙冠』，陶瓷通常用在牙冠貼片，這裡不是最佳選項。"
    ],
    story: `
      材料選擇紀錄還原完成，治療計畫的輪廓逐漸清晰。但檔案最後夾著一份完全不同性質的表單——
      一份<strong>急診紀錄</strong>，時間點在半年前。下一份、也是最後一份證物正在解鎖：<strong>外傷急救</strong>。
    `
  },
  {
    id: 9,
    code: "⑨",
    title: "外傷急救",
    subject: "臨床急症處理",
    intro: "最後一份資料，是半年前 A19 因外傷就診的急診紀錄。這是整份病歷中最關鍵的一段時間線起點。",
    background: `
      <p>牙齒外傷的正確處理原則，會因「牙齒種類」與「離開口腔的時間」而有不同：</p>
      <ul>
        <li>只有<strong>恆牙</strong>適合執行「再植」（Replantation），乳牙脫落不進行再植。</li>
        <li>牙根表面的<strong>牙周韌帶細胞（Periodontal ligament, PDL）</strong>是否存活，是再植成功與否的關鍵；離體時間越短、保存介質越適當，成功率越高。</li>
        <li>保存介質優先順序：<strong>Hank's 平衡鹽溶液 &gt; 冷牛奶 &gt; 病人自己的唾液（含在口腔內）&gt; 生理食鹽水</strong>；
        <strong>絕對不可用自來水</strong>（低張溶液會使牙周韌帶細胞脹破死亡），也不建議用運動飲料（滲透壓與含糖量不利細胞存活）。</li>
        <li>離體乾燥時間若超過 <strong>60 分鐘（黃金時間）</strong>，牙周韌帶細胞大量壞死，再植成功率會大幅下降。</li>
        <li>牙根表面若有明顯髒污，只能用生理食鹽水輕輕沖洗，<strong>絕不可刷洗或用紙巾用力擦拭</strong>牙根表面。</li>
      </ul>
    `,
    task: `
      <p class="scenario">半年前，15 歲的 A19 在籃球比賽中被隊友手肘撞到，<strong>上顎右側中門牙（恆牙）</strong>整顆脫出並掉落在地上。
      隊友撿起牙齒時，已經過了約 <strong>10 分鐘</strong>。現場能取得的液體只有：運動飲料、冰牛奶、生理食鹽水、自來水。</p>
      <p>依照下方五個節點，逐一做出臨床判斷。每個節點只有一個做法符合正確的外傷處置原則——選對才會往下走並拿到一位數字，選錯系統只會告訴你這麼做的後果，不會直接告訴你正確答案。五個節點都走完後，系統會自動組成驗證碼。</p>
      <div id="decision-tree-mount"></div>
    `,
    format: "single",
    inputLabels: ["驗證碼（由決策樹自動組成）"],
    answer: ["73260"],
    decisionNodes: [
      {
        prompt: "節點一：這顆脫出的牙齒，適合執行「再植」處置嗎？",
        options: [
          { label: "是恆牙，適合再植", correct: true, digit: "7" },
          { label: "不論恆牙乳牙都先試著再植看看", correct: false, feedback: "乳牙脫落並不執行再植，先確認牙齒種類再決定是否往下處理。" }
        ]
      },
      {
        prompt: "節點二：牙齒已離開口腔約 10 分鐘，這代表什麼？",
        options: [
          { label: "還在黃金時間內，值得積極搶救", correct: true, digit: "3" },
          { label: "已經超過黃金時間，搶救意義不大", correct: false, feedback: "再想想牙周韌帶細胞能撐多久——10 分鐘和那個時限比起來，差距其實很大。" }
        ]
      },
      {
        prompt: "節點三：牙根表面沾到泥土，該怎麼處理？",
        options: [
          { label: "用生理食鹽水輕輕沖掉髒污", correct: true, digit: "2" },
          { label: "用紙巾用力擦拭消毒牙根表面", correct: false, feedback: "牙根表面附著的牙周韌帶細胞非常脆弱，用力擦拭等於直接把它們刮掉。" }
        ]
      },
      {
        prompt: "節點四：現場有運動飲料、冰牛奶、生理食鹽水、自來水，該用哪一種保存這顆牙齒送醫？",
        options: [
          { label: "自來水，隨手可得又乾淨", correct: false, feedback: "自來水是低張溶液，會讓牙周韌帶細胞吸水脹破，是所有選項中最不該用的。" },
          { label: "運動飲料，含電解質應該有幫助", correct: false, feedback: "滲透壓和含糖量都不利細胞存活，效果比想像中差。" },
          { label: "冰牛奶", correct: true, digit: "6" },
          { label: "生理食鹽水", correct: false, feedback: "不是不能用，但現場有更好的選擇——保存效果排序在它前面。" }
        ]
      },
      {
        prompt: "節點五：接下來最重要的處理原則是？",
        options: [
          { label: "先用清水幫病患漱口消毒，再前往醫院", correct: false, feedback: "不需要額外處理，只會浪費黃金時間，應該把握時間直接送醫。" },
          { label: "立刻送醫，由牙醫師執行再植與固定（splinting）", correct: true, digit: "0" }
        ]
      }
    ],
    hints: [
      "先確認：乳牙不做再植，這顆是恆牙嗎？",
      "10 分鐘有沒有超過黃金 60 分鐘？",
      "牙根不能刷洗、不能用紙巾擦，只能輕輕沖生理食鹽水。",
      "保存介質的優先順序：Hank's液 > 冷牛奶 > 唾液 > 生理食鹽水，絕對不能用自來水或運動飲料。"
    ],
    story: `
      九份證物，全數重建完成。臨床資料重建小組的任務即將進入結案階段——完整診斷報告正在生成。
    `
  }
];

/* ---------- 結案診斷報告 ---------- */
const FINAL_REPORT_HTML = `
  <p><strong>診斷重建摘要 — 病患代號 A19</strong></p>
  <p>綜合九份重建證物，A19 口腔狀況於半年內急速惡化的成因，並非單一事件，而是<strong>多重因子疊加</strong>的結果：</p>
  <ol>
    <li><strong>外傷史（半年前）</strong>：上顎右側中門牙因運動撞擊完全脫出，雖於黃金時間內以冰牛奶保存並完成再植固定，但牙根與牙周組織已受到一次性創傷，修復能力下降，成為後續惡化的起點。</li>
    <li><strong>飲食頻率過高</strong>：Stephan 曲線顯示，A19 習慣少量多餐、頻繁攝取含糖與酸性飲品，三段脫礦期首尾相連，牙齒幾乎沒有機會完整再礦化，導致琺瑯質與牙本質持續脫礦。</li>
    <li><strong>高風險飲品攝取</strong>：飲食日記證實可樂、運動飲料、柳橙汁、黑咖啡為其日常飲品，皆屬 pH 低於臨界值的高風險品項，加劇酸襲擊強度。</li>
    <li><strong>牙周組織不可逆破壞</strong>：探測診斷顯示兩顆臼齒已出現附連組織喪失，證實發炎已從可逆的齦炎階段，進展為不可逆的牙周炎。</li>
    <li><strong>咬合功能代償</strong>：解剖定位顯示 TMJ 與咀嚼肌長期負擔異常，可能與患處牙齒疼痛迴避咬合、咬合力分布不均有關。</li>
  </ol>
  <p><strong>結論</strong>：A19 的口腔惡化是「一次外傷 × 高頻率高風險飲食 × 潔牙習慣不足」共同作用的結果。
  單一治療（如僅修復蛀牙）無法根本解決問題，需同時介入飲食衛教、牙周治療與定期咬合追蹤。</p>
  <p class="report-signoff">— 臨床資料重建小組　結案報告 —</p>
`;
