---
name: gh-issue-branch
description: 機能追加の要望からGitHub Issueを作成し、対応するローカルのfeatureブランチを作成・チェックアウトします。
---

# GitHub Issue & Branch Creation Workflow

ユーザーから提供された機能追加の内容に基づき、GitHub Issueの作成とローカルブランチの作成を自動化します。

## ワークフロー

1. **内容の把握と計画**
   - ユーザーからの入力を分析し、以下の項目を決定します。
     - **Issue Title**: 機能の要旨を簡潔に表すタイトル。
     - **Issue Body**: 実装の目的、背景、期待される動作を含む詳細な説明。
     - **Branch Name**: `feature/` プレフィックスにIssue番号と簡潔な説明を組み合わせた名前（例: `feature/123-add-login-api`）。

2. **GitHub Issueの作成**
   - `gh issue create` コマンドを使用して、GitHub上にIssueを作成します。
   - `run_shell_command` を使用して以下を実行します。
     ```bash
     gh issue create --title "決定したタイトル" --body "決定した本文"
     ```
   - コマンドの出力から作成されたIssueの番号を取得します。

3. **ローカルブランチの作成とチェックアウト**
   - 取得したIssue番号をプレフィックス（`feature/番号-説明`）として使用して、ローカルブランチを作成しチェックアウトします。
   - `run_shell_command` を使用して以下を実行します。
     ```bash
     git checkout -b "決定したブランチ名"
     ```

4. **完了報告**
   - 作成したIssueのURLと、チェックアウトしたブランチ名をユーザーに報告します。

## 注意事項
- GitHub CLI (`gh`) がインストールされ、認証済みであることを前提とします。
- すでに同名のブランチが存在する場合は、別の名前を検討してください。
- 作成前に決定したタイトル、本文、ブランチ名をユーザーに確認する必要はありません（AIが自動的に決定します）。
