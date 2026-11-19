# Plugin Flow Core

[English](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README_CN.md)

![Zealamic Plugin Flow cover](https://github.com/zealamic/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

Nguồn duy nhất cho mọi thứ mà các nền tảng zla-flow dùng chung. Không có gì ở đây được phát hành: mỗi plugin nền tảng phải tự chứa đủ khi cài đặt, nên `pnpm sync` ghi các bản sao được sinh ra vào thư mục từng nền tảng, và `pnpm check` thất bại khi có bản sao nào đã cũ.

> **Note**
> Plugin Flow chạy quy trình PM/Reviewer với cổng phê duyệt của con người ở mọi bước: BRD, Plan, giao việc viết code, Review, Commit. Nó không bao giờ bỏ qua cổng và không lưu API key; nó chỉ ghi tên biến môi trường chứa key.
>
> Nó không phải là model viết code hay môi trường chạy agent. Coder là model hoặc CLI bạn cấu hình trong `.zla-flow/coder.json`.

## What lives here

| Source | Generated into |
|---|---|
| `protocol/protocol.md`: giao thức quy trình (phase, cổng, file trạng thái, cách chọn coder, flag, quy tắc cứng) | `packages/claude/skills/zla-flow/SKILL.md` (kèm frontmatter của skill và `$ARGUMENTS`), `packages/dsh/protocol.js` (`PROTOCOL`) |
| `protocol/usage.txt`: dòng usage duy nhất | Cả hai giao thức, `argument-hint` của skill, và `USAGE` trong `packages/dsh/protocol.js` |
| `platforms/<platform>/*.md`: phần khác nhau theo từng nền tảng | Được ghép vào giao thức của nền tảng đó |
| `platforms/claude/skill-header.md`: frontmatter của skill | Đầu file `SKILL.md` |
| `config/coder.example.json`: mẫu `coder.json` | `packages/claude/config/`, `packages/dsh/config/`, và khối `CODER_TEMPLATE` trong `packages/dsh/client.js` |
| `icon.svg`: biểu tượng | `packages/dsh/icon.svg` |

## Placeholders

`protocol.md` chứa các placeholder `{{name}}`. `{{usage}}` là dòng usage; mọi tên khác là file `platforms/<platform>/<name>.md`, đã cắt khoảng trắng. Mỗi nền tảng phải có đủ mọi fragment mà giao thức dùng; file rỗng được phép và sẽ xóa placeholder.

| Fragment | Holds |
|---|---|
| `preamble` | Ghi chú của nền tảng, đặt ngay sau dòng usage (Claude: quy tắc khi không có input). |
| `roles` | Các giá trị vai trò mà nền tảng có thể giao cho Plan và Review. |
| `coder-mechanisms` | Cách nền tảng chạy coder, gồm cả "session default". |

## Workflow

1. Sửa nguồn ở đây, không bao giờ sửa bản sao được sinh ra. Các file được sinh ra có ghi chú này ở những dòng đầu.
2. Chạy `pnpm sync` ở thư mục gốc của repository.
3. Chạy `pnpm check`. Lệnh này kiểm tra theo thứ tự:
   - mọi file được sinh ra khớp với nguồn (`pnpm sync:check`)
   - `pnpm typecheck`, `pnpm test` và `pnpm lint`
   - `pnpm check:parity`: mọi giao thức được phát hành đều có đúng năm dòng cổng ⏸ giống hệt nhau, từng chữ

## Adding a platform

1. Tạo `platforms/<platform>/` với một file `.md` cho mỗi placeholder.
2. Thêm các đầu ra của nền tảng vào danh sách `outputs` trong `scripts/sync.mjs`.
3. Chạy `pnpm sync`, rồi `pnpm check`.

## Not generated

- `.claude-plugin/icon.png` của plugin Claude được render thủ công từ `icon.svg` (bộ validator cần PNG 512 px), vì không có công cụ Node di động nào để render SVG. Hãy render lại khi biểu tượng thay đổi.
- README của từng nền tảng và văn bản giao diện của nó, như từ điển của trang DeepSeek Harness, mô tả nền tảng bằng lời riêng và nằm trong thư mục của nền tảng đó.

## License

MIT © Zealamic
