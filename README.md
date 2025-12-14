# Bug Hunter Lifetime Earnings

## プロジェクト概要
- Wordfenceの WordPress Vulnerability Database + WordPress.org Plugin API を利用し、研究者名ごとに推定報奨金を集計。
- Flask バックエンドが外部APIを呼び、`name` クエリで絞り込み、推定金額・参照URLなどページ描画に必要な情報を返却。
- Vite + React フロントエンド(my-frontend)が `http://localhost:5000` を叩き、合計金額、月次チャート、脆弱性一覧を表示。

## ディレクトリ構成
- `backend/app.py` : Flask エントリーポイント。CORSは `http://localhost:5173` / `127.0.0.1:5173` を許可。
- `backend/routes.py` : `/` エンドポイント。`name` が無いと400、該当無しで404。
- `backend/services/api.py` : Wordfence脆弱性リストから研究者名を絞り込み、Plugin APIでアクティブインストール数取得。
- `backend/services/bounty.py` : `calculate/bountydata.txt` を読み込み、CWE→カテゴリ/タイトル→認証レベルを推定し、インストール数レンジに応じて報奨金を算出。
- `my-frontend/src/Fetch.jsx` : 研究者名入力→API呼び出し→カードと折れ線グラフで表示。

## 前提環境
- Python 3.11+ 推奨
- Node.js 20+ / npm
- 外部APIへ到達できるネットワーク（Wordfence, api.wordpress.org）

## セットアップ
### 1) バックエンド
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r ../requirements.txt
python app.py
```

### 2) フロントエンド
```bash
cd my-frontend
npm install
npm run dev                 # デフォルト http://127.0.0.1:5173/
```

## 使い方
1. バックエンドを起動したまま、別ターミナルでフロントエンドを起動。
2. ブラウザで `http://127.0.0.1:5173/` を開き、研究者名を入力して「Fetch」を押下。
3. 合計報奨金、月次推移、脆弱性タイトルと報奨金・公開日・参照URLが表示されます。

## 報奨金推定ロジックの補足
- CWE ID からカテゴリを決定 (`services/bounty.py` の `CWE_TO_CATEGORY`)。
- 脆弱性タイトルから認証レベルを推定（例: unauthenticated -> No Authentication, contributor+ -> Mid-Level Authentication）。
- アクティブインストール数レンジ + カテゴリ + 認証レベルを `calculate/bountydata.txt` と照合し報奨金を決定。条件が揃わない場合は0ドル。
- 研究者名が複数含まれる場合、ターゲット名と一致したもののみ加算します。

## ここ直したいな～リスト
- 外部 API 依存でレスポンスが遅い。
- Submitしたレポートが多ければ多いほどアクセスが多くなるため、結果が遅くなってしまう。
- そもそも報奨金シミュレータの精度が良くないため、ごくたまにインストール数が100でCVSSが6未満の脆弱性に3000ドルもの報奨金が与えられてしまう。タイトルの内容とCWEから推測するのには限界があるが、判断に生成AIを使うとトークンが...
