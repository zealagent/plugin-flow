# zlak-flow for Claude Code

[English](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/claude/README.md) | [Tiếng Việt](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/claude/README_VI.md) | [中文](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/claude/README_CN.md)

![Zealakit Agent Plugin Flow cover](https://github.com/zealakit/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

Quy trình xây dựng PM/Reviewer với cổng phê duyệt của con người ở mọi bước, dưới dạng plugin Claude Code: skill `/zlak-flow`. Plan và Review có thể chạy trong session hiện tại hoặc trên một model Claude rẻ hơn.

Coder có thể là subagent của session này, một Harness MCP server, bất kỳ endpoint tương thích Anthropic nào, hoặc bất kỳ CLI nào. Không có gì bị gắn cứng với một nhà cung cấp.

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow chạy quy trình PM/Reviewer với cổng phê duyệt của con người ở mọi bước: BRD, Plan, giao việc viết code, Review, Commit. Nó không bao giờ bỏ qua cổng và không lưu API key; nó chỉ ghi tên biến môi trường chứa key.
>
> Nó không phải là model viết code hay môi trường chạy agent. Coder là model hoặc CLI bạn cấu hình trong `.zlak-flow/coder.json`.

## Install

Từ marketplace trong repository này:

```text
/plugin marketplace add zealakit/agent-plugin-flow
/plugin install zlak-flow@zealakit
```

Hoặc nạp trực tiếp từ một bản checkout cho một session:

```bash
claude --plugin-dir packages/claude
```

## Use it

```text
/zlak-flow Add pagination to GET /orders, 100 rows max, with unit tests.
```

Phase 1 viết BRD và dừng ở GATE 1. Trả lời từng cổng ngay trong cuộc trò chuyện:

```text
approve BRD
approve plan
approve review, commit
reject <reason>
```

| Flag | Argument | Default | Description |
| --- | --- | --- | --- |
| `--setup` | — | — | Ghi hoặc làm mới `coder.json`. Lệnh hỏi bạn giao thức, endpoint và tên biến khóa của từng provider, và ghi ngay. Lệnh cũng thêm `.zlak-flow/` vào `.gitignore` nếu chưa được bỏ qua. |
| `--approve-all` | — | — | Duyệt trước GATE 1, 2 và 3. Vẫn dừng khi có part lỗi, review chưa OK, model chưa resolve hoặc BRD chưa rõ. Không bao giờ commit hay push: bạn nói khi nào commit. |
| `--planner` | `<use>` | `roles.planner.use`, nếu không có thì `self` | Ai viết kế hoạch. |
| `--reviewer` | `<use>` | `roles.reviewer.use`, nếu không có thì `self` | Ai review. |
| `--coder` | `model:<profile>[/<alias>]` | `active` trong `coder.json` | Coder profile cho lần chạy này, kèm alias model của profile đó nếu cần. |
| `--adopt` | `[path]` | — | Tiếp quản một dự án đã có plan, BRD hoặc code. |
| `--resume` | `<task-id>` | — | Tiếp tục một lần chạy bị gián đoạn từ file trạng thái của nó. |
| `--from` | `<brd\|plan\|execute\|review>` | — | Bắt đầu từ phase đó khi các artifact trước đó đã có. |

`--from` không bao giờ bỏ qua một lần phê duyệt: `plan` cần GATE 1, `execute` cần GATE 1 và 2, còn `review` cần thêm các phần đã được thực thi. Cổng nào chưa được ghi trong file trạng thái `.zlak-flow/state/<task-id>.json` sẽ được trình bày lại, và lần chạy dừng ở đó. `--resume` tính phần đang `running` là thất bại và tiếp tục ở phần đầu tiên chưa xong.

## Phases and gates

| Phase | What happens | Gate |
| --- | --- | --- |
| 0. Adopt | Quét plan, BRD và code hiện có; gắn nhãn cho từng phần kèm bằng chứng. Chỉ đọc bên ngoài `.zlak-flow/`. | ⏸ GATE 0 |
| 1. BRD | Mục tiêu, phạm vi, yêu cầu, tiêu chí nghiệm thu, rủi ro; nêu tên planner, reviewer và coder. | ⏸ GATE 1 |
| 2. Plan | Các file plan được đánh số trong `.zlak-flow/plans/<task-id>/`, mỗi file đủ nhỏ cho một lượt chạy của coder. | ⏸ GATE 2 |
| 3. Execute | Từng phần một, chạy test sau mỗi phần; không commit. | ⏸ PART FAILED, chỉ khi có lỗi |
| 4. Review | Diff thật, một lượt cho mỗi phần, mỗi phát hiện kèm file và dòng. | ⏸ GATE 3 |
| 5. Commit | Một commit chứa các file của lần chạy này. Không bao giờ push. | sau GATE 3 |

Một cổng chỉ được duyệt bằng sự đồng ý rõ ràng cho đúng cổng đó. Một câu "ok" mơ hồ sẽ bị hỏi lại. Ở GATE 3 hãy trả lời `approve`, `fix` + hướng dẫn, `discard` hoặc `stop`. Ở PART FAILED hãy trả lời `retry` (có thể kèm tên profile hoặc alias khác), `fix`, `discard` hoặc `stop`. Không có gì bị hoàn tác trừ khi bạn trả lời `discard`.

## Roles

Plan và Review được chọn từ `--planner` / `--reviewer`, rồi `roles.<role>.use` trong `.zlak-flow/coder.json`, rồi `self`.

| Value | Meaning |
| --- | --- |
| `self` | Session này làm việc đó. Mặc định, đắt nhất. |
| `subagent` | Một subagent chỉ đọc, dùng model subagent mặc định của session. |
| `claude:<model>` | Một subagent chỉ đọc trên alias model đó, ví dụ `claude:haiku` hoặc `claude:sonnet`. |
| `model:<profile>[/<alias>]` | Công cụ `run_role` của Harness trên profile `coder.json` đó, chỉ đọc. Cần có Harness. |

Planner được giao việc sẽ trả về văn bản plan và session này ghi các file. Vai trò nào thiếu lane sẽ được báo ở GATE 1, và chỉ dùng `self` nếu bạn đồng ý.

## Coder configuration

`coder.json` là tùy chọn. Để cấu hình coder, hãy sao chép [`config/coder.example.json`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/claude/config/coder.example.json) vào `.zlak-flow/coder.json` trong dự án của bạn và điền endpoint, model và **tên** biến môi trường chứa key. File này giống nhau trên mọi nền tảng của zlak-flow. Khi hoàn toàn không có `coder.json`, coder là một subagent biết sửa file của session hiện tại.

| Situation | Lane |
| --- | --- |
| Một Harness MCP server đang được kết nối | Harness chạy mọi phần, cho mọi profile. |
| Không có `coder.json` và không có `--coder` | Một subagent biết sửa file của session này. |
| Profile `protocol: "command"` | CLI chạy qua Bash với `{model}`, `{prompt_file}`, `{workdir}`, `{branch}`. |
| Profile `protocol: "anthropic"` | `claude -p` chạy headless trên `base_url`, key được truyền từ `api_key_env`. |
| Profile `protocol: "openai"` | Cần Harness; nếu không có, lần chạy dừng và báo rõ. |

Quy trình không bao giờ tự đổi lane, profile hay model sau một lỗi.

### Adding a coder

Không cần đổi plugin hay skill: chỉ sửa `.zlak-flow/coder.json`.

Một gói plan mới của nhà cung cấp hiện có là một profile `extends` profile cũ và chỉ ghi đè phần khác biệt:

```json
"provider-pro": { "extends": "provider-lite", "api_key_env": "PROVIDER_PRO_API_KEY" }
```

Một model mới của nhà cung cấp hiện có là một alias trong map `models` của profile đó, dùng như `/zlak-flow --coder model:<profile>/<alias> <task>`. Một nhà cung cấp mới là một profile có `protocol`:

| Protocol | Use when | How zlak-flow runs it without a Harness |
| --- | --- | --- |
| `anthropic` | Endpoint nói API messages của Anthropic. | `claude -p` headless với `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` (lấy từ `api_key_env`) và `ANTHROPIC_MODEL`. |
| `openai` | Một endpoint chat tương thích OpenAI. | Không chạy được: lane này cần một Harness tự chạy vòng lặp công cụ. |
| `command` | Bất kỳ CLI agent nào khác hoặc script của bạn. | Chạy `command` sau khi thay `{model}`, `{prompt_file}`, `{workdir}`, `{branch}` và lấy env từ `env`. |

### Harness contract

Harness là một MCP server chạy các job của coder cho mọi profile. Khi có một Harness được kết nối, zlak-flow dùng nó trước. Một adapter phải đáp ứng:

- `submit_task(plan_file, coder, model_alias, context_summary)` chạy một phần plan và trả về `job_id`; công việc diễn ra trên nhánh `<branch_prefix><task-id>`. Nó từ chối job mới khi một job khác đang chạy (`limits.max_concurrent_jobs`, mặc định 1) và từ chối prompt vượt quá `limits.job_prompt_max_chars`.
- Nó áp dụng `limits.job_memory_limit_mb` và `timeout_seconds` lên tiến trình coder, kết thúc job khi vượt giới hạn và báo `failed` với lý do `memory_limit` hoặc hết thời gian.
- `get_status(job_id)` trả về `queued | running | done | failed` cùng một bản tóm tắt ngắn.
- `get_result(job_id)` trả về các file đã đổi, diff của phần đó, kết quả test của chính Harness (không phải lời khẳng định của coder) và đường dẫn file log.
- `run_role(role, coder, model_alias, prompt_file)` chạy một prompt planner hoặc reviewer chỉ đọc trên bất kỳ coder nào đã cấu hình và trả về văn bản của nó. Nó không được cho phép ghi file hay ghi git.
- Harness không bao giờ commit, không bao giờ push, và không bao giờ đọc hay trả về API key.

Với công việc tiếp quản, `submit_task` nhận trong `context_summary` trạng thái của phần đó (`not_started` hoặc `partial`), những gì đã có với phần `partial`, và lệnh test đã phát hiện của dự án. Harness chỉ chạy test của phần đó cùng lệnh test hiện có, và không đụng vào file ngoài phạm vi đã khai báo của phần.

## Package layout

```text
packages/claude/
├── .claude-plugin/plugin.json   plugin manifest (icon.png beside it)
├── skills/zlak-flow/SKILL.md     the workflow protocol (/zlak-flow, generated)
├── config/coder.example.json    starter project configuration (generated)
├── tests/plugin.test.mjs        offline checks (pnpm test), not shipped
└── README.md                    this document
```

`SKILL.md` và `config/coder.example.json` được sinh ra từ [`packages/core`](https://github.com/zealakit/agent-plugin-flow/blob/main/packages/core/README.md): hãy sửa giao thức và các fragment của Claude ở đó rồi chạy `pnpm sync` ở thư mục gốc repository. `pnpm check` xác nhận các file được sinh ra còn mới, manifest và skill đúng định dạng, và marketplace ở thư mục gốc trỏ về đây.

## Limitations

- Các cổng có hiệu lực vì model tuân theo giao thức. Không có hook nào ép buộc, nên hãy coi các dòng cổng là hợp đồng và từ chối một cách rõ ràng.
- `coder.json` là một quy ước, không phải schema được kiểm tra. Gõ sai sẽ hiện ra như một lỗi của coder, không phải lỗi xác thực.
- Lane `anthropic` cần CLI `claude` trong `PATH`. Giới hạn bộ nhớ khi chạy chỉ được áp dụng khi một Harness chạy coder.
- Chỉ Phase 5 commit, và quy trình không bao giờ push.

## License

MIT © Zealakit. Viết bởi nqhed - Huy Ed. Nguyen.
