# Smart Restaurant OS

## Prompt Mẫu Implement Step

Dùng prompt này khi muốn Codex implement từng file plan trong `docs/plan/steps/`.

```text
Đọc docs/PROJECT_RULES.md và implement theo docs/plan/steps/01_project_foundation.md.
Chỉ làm scope trong file plan này.
Hoàn thành API + UI + smoke test theo đúng Definition of Done trong file.
Sau khi xong, báo tôi cách test để tôi review trước khi chuyển step tiếp theo.
```

Khi chuyển step, chỉ đổi đường dẫn file plan. Ví dụ:

```text
Đọc docs/PROJECT_RULES.md và implement theo docs/plan/steps/03_branch_management.md.
Chỉ làm scope trong file plan này.
Hoàn thành API + UI + smoke test theo đúng Definition of Done trong file.
Sau khi xong, báo tôi cách test để tôi review trước khi chuyển step tiếp theo.
```

