# zla-flow for DeepSeek Harness

[English](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/README.md) | [Tiếng Việt](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/README_VI.md) | [中文](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/README_CN.md)

![Zealamic Plugin Flow cover](https://github.com/zealamic/agent-plugin-flow/blob/main/assets/images/agent-plugin-flow-cover.jpg?raw=true)

Quy trình xây dựng PM/Reviewer với cổng phê duyệt của con người ở mọi bước, được đưa vào DSH dưới dạng một trang ở thanh bên trái cùng lệnh `/zla-flow`. Plan và Review có thể chạy trong session hiện tại hoặc giao cho một model rẻ hơn hay khác; coder có thể là bất kỳ nhà cung cấp, model hay CLI nào mà profile này truy cập được. Không có gì bị gắn cứng với một nhà cung cấp.

```text
Phase 0 Adopt ─▶ GATE 0 ─▶ Phase 1 BRD ─▶ GATE 1 ─▶ Phase 2 Plan ─▶ GATE 2
       ─▶ Phase 3 Execute ─▶ Phase 4 Review ─▶ GATE 3 ─▶ Phase 5 Commit
```

> **Note**
> Plugin Flow chạy quy trình PM/Reviewer với cổng phê duyệt của con người ở mọi bước: BRD, Plan, giao việc viết code, Review, Commit. Nó không bao giờ bỏ qua cổng và không lưu API key; nó chỉ ghi tên biến môi trường chứa key.
>
> Nó không phải là model viết code hay môi trường chạy agent. Coder là model hoặc CLI bạn cấu hình trong `.zla-flow/coder.json`.

## Install

Bật bundle `@zealamic/agent-plugin-flow-dsh` trong Settings → Plugins, rồi tải lại trang. Lệnh `/zla-flow` và mục ở thanh bên sẽ xuất hiện sau đó.

## What it adds

- **Một mục ở thanh bên trái** tên `zla-flow`, mở một trang đầy đủ ở cột chính.
- **Trang này**: ô nhập task kèm coder profile và alias model tùy chọn, một nút đưa lệnh vào một session mới, một dòng lệnh có thể sao chép, một mẫu `coder.json` có thể sao chép, và phần tham chiếu về phase, cổng, vai trò, flag, giới hạn và cấu trúc file.
- **Lệnh `/zla-flow`**: mở rộng toàn bộ giao thức vào cuộc trò chuyện và bắt đầu một lượt, nên mọi cổng sau đó là một tin nhắn bình thường bạn trả lời.

## Where it appears

| Surface | What it is |
|---|---|
| Sidebar | Biểu tượng `zla-flow`, sau Plugins và Schedules. Nhấp vào sẽ mở trang. |
| Main column | Trang `zla-flow`, khóa `zla-flow`: các nút khởi chạy ở trên, phần tham chiếu ở dưới. |
| Composer | `/zla-flow [flags] <task>`, trong bất kỳ session nào. |

## Use it

1. Nhấp `zla-flow` ở thanh bên trái.
2. Nhập task, ví dụ `Add pagination to GET /orders, 100 rows max, with unit tests.`
3. Tùy chọn đặt coder profile và alias model chỉ cho lần chạy này.
4. Nhấn **Start in a new session**. Một session mới mở ra với `/zla-flow <flag của bạn> <task của bạn>` đã nằm sẵn trong ô soạn.
5. Nhấn Enter ở đó. Phase 1 (BRD) chạy và dừng ở GATE 1.
6. Trả lời từng cổng trong cuộc trò chuyện:

```text
approve BRD
approve plan
approve review, commit
reject <reason>
```

Gõ lệnh trực tiếp cũng tương đương: `/zla-flow --coder model:default/fast Add pagination to GET /orders`.

## Phases and gates

| Phase | What happens | Gate |
|---|---|---|
| 0. Adopt | Quét plan, BRD và code hiện có; gắn nhãn cho từng phần kèm bằng chứng. Chỉ đọc bên ngoài `.zla-flow/`. | ⏸ GATE 0 |
| 1. BRD | Mục tiêu, phạm vi, ngoài phạm vi, yêu cầu, tiêu chí nghiệm thu, rủi ro. | ⏸ GATE 1 |
| 2. Plan | Các file plan được đánh số, mỗi file đủ nhỏ cho một lượt chạy của coder. | ⏸ GATE 2 |
| 3. Execute | Từng phần một, theo thứ tự trong index; dừng ở lỗi đầu tiên. Không commit. | ⏸ PART FAILED, chỉ khi có lỗi |
| 4. Review | Đọc diff thật, một lượt cho mỗi phần, mỗi phát hiện kèm file và dòng. | ⏸ GATE 3 |
| 5. Commit | Một `git commit` với thông điệp rõ ràng; báo hash. Không bao giờ push. | sau GATE 3 |

Một cổng chỉ được duyệt bằng sự đồng ý rõ ràng cho đúng cổng **đó**. Một câu "ok" hay "tiếp đi" mơ hồ sẽ bị hỏi lại thay vì đoán. Từ chối sẽ dừng lần chạy ở phase đó cho đến khi bạn đưa hướng đi mới.

Phase 3 chạy thẳng sang Phase 4 trong cùng một lượt; mọi phase khác là một lượt riêng. Trước phần đầu tiên, Phase 3 kiểm tra cây làm việc sạch, chuyển sang `<branch_prefix><task-id>` khi có đặt prefix, và chọn coder. Lệnh test chạy sau mỗi phần, và một test lỗi sẽ dừng lần chạy.

### Answering GATE 3

| Answer | What happens |
|---|---|
| `approve` | Phase 5 chỉ commit các file mà lần chạy này đã thay đổi. |
| `fix` + hướng dẫn | Các thay đổi của coder được giữ lại. Các unit `NN-fix-<slug>.md` mới được viết và trình bày ở GATE 2; sau khi duyệt, chỉ chúng được thực thi và review. |
| `discard` | Hoàn tác đúng các file được liệt kê trong file trạng thái, hiển thị những gì đã hoàn tác, rồi dừng. |
| `stop` / `reject` | Giữ nguyên cây làm việc và tóm tắt những gì chưa commit. |

Không có gì bị hoàn tác, reset hay stash trừ khi bạn trả lời `discard`.

### Answering PART FAILED

Khi một phần của coder lỗi, một test lỗi hoặc vượt giới hạn, Phase 3 đánh dấu phần đó là thất bại, bỏ qua Phase 4 và dừng ở `⏸ PART FAILED`.

| Answer | What happens |
|---|---|
| `retry` [profile hoặc alias] | Chạy lại phần lỗi một lần nữa, với cùng coder hoặc coder bạn nêu, rồi tiếp tục các phần còn lại. |
| `fix` + hướng dẫn | Viết một unit `NN-fix-<slug>.md` và trình bày ở GATE 2; sau khi duyệt, nó và các phần còn lại chạy, rồi đến Phase 4. |
| `discard` | Giống như ở GATE 3. |
| `stop` | Giống như ở GATE 3; một `--resume` sau đó sẽ tiếp tục ở phần lỗi. |

## Roles and cost control

Plan và Review là các bước tốn kém nhất. Mỗi vai trò được chọn từ flag, rồi `roles.<role>.use` trong `coder.json`, rồi `self`.

| Value | Meaning |
|---|---|
| `self` | Session này làm việc đó. Mặc định, đắt nhất. |
| `subagent` | Một subagent chỉ đọc trên model mặc định của profile. |
| `subagent:<provider>/<model>` | Một subagent chỉ đọc trên nhà cung cấp và model chỉ định rõ, ví dụ `subagent:openai/gpt-5.1` hoặc `subagent:deepseek/deepseek-chat`. Nhà cung cấp nào profile có đều dùng được. |
| `model:<profile>[/<alias>]` | Một subagent chỉ đọc trên nhà cung cấp và model của một profile `coder.json`, có thể kèm alias. Chỉ các profile `anthropic`, `openai` hoặc `host`: profile `command` sửa file nên không thể giữ vai trò. |

Vai trò được giao là chỉ đọc: không được sửa file, ghi git hay commit. Planner và reviewer được nêu tên ở GATE 1, và reviewer lại được nêu ở GATE 2, để bạn đổi trước khi tốn bất kỳ chi phí nào.

## Coder mechanisms

Phase 3 giao một phần plan cho coder và chờ. Quy trình dùng cơ chế đầu tiên mà profile thực sự cung cấp, và dừng kèm thông báo rõ ràng khi không có cơ chế nào:

1. **Một subagent biết sửa file**, được khởi động với nhà cung cấp và model của coder profile. Đây là lane mặc định trong DSH.
2. **Một MCP coder server**, khi có cái được kết nối.
3. **Một CLI coder**, từ `protocol: "command"` của profile.

Nó không bao giờ tự thay cơ chế này bằng cơ chế khác sau một lỗi: nó báo lỗi, nêu các lựa chọn thay thế và chờ.

## Coder configuration

`coder.json` là tùy chọn. Khi không có nó, cũng không có `--coder`, coder là mặc định của session: một subagent biết sửa file trên model mặc định của session này, nếu không thì một MCP coder đang kết nối. Một CLI coder luôn cần một profile.

Để dùng các provider mà app đã có mà không phải ghi endpoint hay khóa, hãy chạy `/zla-flow --setup` một lần sau khi cài. Lệnh đọc provider và model của app, ghi `.zla-flow/coder.json` ngay, không có bước duyệt, và không bao giờ xóa profile. Lệnh cũng thêm `.zla-flow/` vào `.gitignore` của project nếu chưa được bỏ qua, để các file của workflow không lọt vào commit của bạn. Mỗi provider được thêm thành một profile `host`; profile bạn tự viết, cùng `roles`, `workspace` và `limits`, không bị đụng tới. Chạy lại khi thêm provider; GATE 1 cũng báo khi app có provider mà `coder.json` chưa có.

Một coder không chọn được (thiếu profile hoặc alias, chuỗi `extends` bị hỏng) không bao giờ chặn BRD hay Plan: GATE 1 và GATE 2 hiển thị nó là "unresolved" kèm lý do, để bạn sửa kịp thời. Chỉ Phase 3 mới dừng vì nó.

Tạo `.zla-flow/coder.json` trong dự án. Nút **Copy coder.json template** của trang sao chép một file khởi tạo; cùng file đó được phát hành dưới dạng [`config/coder.example.json`](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/dsh/config/coder.example.json). Đây là một quy ước mà quy trình đọc, không phải file mà DSH kiểm tra.

```jsonc
{
  "version": 6,
  "active": "default",            // default coder profile
  "fallback": [],                 // a menu, never an automatic switch
  "coders": {
    "default": {
      "protocol": "openai",       // anthropic | openai | command
      "base_url": "https://…",
      "api_key_env": "CODER_API_KEY",  // the NAME of an env var, never the key
      "model": "default",         // default alias
      "models": { "default": "…" },    // short alias → real model id
      "temperature": 0.2,
      "max_tokens": 8192,
      "timeout_seconds": 900
    }
  }
}
```

### Transport lanes

| Protocol | Use it when | Fields that matter |
|---|---|---|
| `anthropic` | Nhà cung cấp nói API messages của Anthropic, trực tiếp hoặc qua proxy. | `base_url`, `api_key_env`, `model`, `models` |
| `openai` | Nhà cung cấp nói API chat của OpenAI: API được lưu trữ, gateway, vLLM, Ollama, LM Studio. | `base_url`, `api_key_env`, `model`, `models`, `temperature`, `max_tokens` |
| `command` | Bất kỳ CLI nào trên máy: CLI của nhà cung cấp, CLI agent, hoặc script của bạn. | `command`, `env`, `model`, `models`, `timeout_seconds` |
| `host` | Provider mà app đã có sẵn, do `--setup` ghi: không có `base_url` và không có khóa. | `provider`, `model`, `models`, `generated` |

Các placeholder của profile `command` là `{model}`, `{prompt_file}`, `{workdir}` và `{branch}`. Lệnh phải sửa file trong `{workdir}` và thoát với mã 0 khi thành công.

Lệnh chạy từ thư mục gốc dự án với `env` của profile. Một file prompt được ghi trong `.zla-flow/state/`, và `timeout_seconds` giới hạn thời gian chạy.

### Profile inheritance

Một profile có thể `extends` profile khác và chỉ ghi đè phần khác biệt, nên hai gói của cùng một nhà cung cấp dùng chung endpoint và chỉ khác key hoặc model. Lần chạy gộp chuỗi theo từng trường, con đè cha; các map `models` gộp theo từng khóa. Chu trình hoặc thiếu profile cha sẽ dừng lần chạy.

### Keys

Chỉ **tên** biến môi trường được phép nằm trong file. Quy trình không bao giờ hỏi key, không bao giờ in key, và không bao giờ đưa key vào plan hay commit. Hãy đặt biến trong môi trường khởi động DSH.

## `coder.json` reference

| Field | Meaning |
|---|---|
| `version` | Phiên bản định dạng của file này. |
| `active` | Profile mặc định cho các lần chạy không có `--coder`. |
| `fallback` | Các profile được đề xuất khi profile đang dùng lỗi. Không bao giờ tự dùng. |
| `coders.<name>` | Một profile: `protocol`, `base_url`, `api_key_env`, `model`, `models`, `timeout_seconds`, tùy chọn `extends`, `temperature`, `max_tokens`, `command`, `env`. |
| `workspace.branch_prefix` | Prefix cho nhánh của coder, khi cơ chế có dùng nhánh. |
| `workspace.test_command` | Lệnh test thật của dự án, được phát hiện hoặc nêu rõ. |
| `roles.planner.use` | Ai viết plan. |
| `roles.reviewer.use` | Ai review. |
| `roles.reviewer.verify_high_severity` | Khi được giao, mở lại mọi phát hiện mức nghiêm trọng cao trong session này. Mặc định `true`. |
| `limits` | Ngân sách kích thước và thời gian chạy, bên dưới. |
| `adopt` | Đường dẫn tìm kiếm và các file ngữ cảnh cho Phase 0. |

## Size and runtime limits

| Field | Default | What it bounds |
|---|---|---|
| `plan_max_lines` | 120 | Số dòng mỗi file plan. |
| `plan_max_steps` | 8 | Số bước mỗi file plan. |
| `plan_max_files_touched` | 6 | Số file một phần plan được phép chạm tới. |
| `review_max_diff_lines` | 600 | Số dòng diff mỗi lượt review. |
| `max_concurrent_jobs` | 1 | Số job coder chạy cùng lúc. |
| `job_prompt_max_chars` | 24000 | Số ký tự giao cho một job coder. |
| `job_memory_limit_mb` | 4096 | Ngân sách bộ nhớ mà một job coder giả định. |

Quy trình tách các file plan để nằm trong các giới hạn này. Việc áp dụng thật sự cho bộ nhớ và số job đồng thời thuộc về host chạy coder, không phải trang này.

Một file plan vượt giới hạn được tách thành `NN-<slug>-01.md`, `NN-<slug>-02.md` và tiếp theo, theo ranh giới module hoặc tầng, không bao giờ cắt giữa một bước, và mọi phần đều được liệt kê trong index.

## Where things live

| Path | Purpose |
|---|---|
| `.zla-flow/coder.json` | Profile, vai trò, giới hạn, đường dẫn tiếp quản. |
| `.zla-flow/plans/<task-id>/` | `00-index.md` cùng một file cho mỗi đơn vị công việc. |
| `.zla-flow/state/<task-id>.json` | Tiến độ của lần chạy hiện tại, để `--resume` có thể tiếp tục. |

Quy trình không bao giờ sửa, di chuyển, đổi tên hay xóa bất cứ thứ gì của bạn; các file dẫn xuất nằm trong `.zla-flow/`.

`<task-id>` là `YYYYMMDD-<slug>`, được suy ra một lần từ task và nêu trong câu trả lời đầu tiên. File trạng thái có hình dạng cố định:

```json
{
  "task_id": "20261118-orders-pagination",
  "task": "…",
  "phase": 3,
  "approved_gates": [1, 2],
  "planner": "self",
  "reviewer": "subagent",
  "coder": { "profile": "default", "alias": "default", "model": "…", "mechanism": "subagent" },
  "branch": "task/20261118-orders-pagination",
  "parts": [{ "file": "01-api.md", "status": "done", "changed_files": ["src/orders.ts"], "error": null }],
  "updated_at": "…"
}
```

Một cổng chỉ được liệt kê trong `approved_gates` sau khi bạn duyệt nó trong cuộc trò chuyện; file tồn tại trên đĩa không bao giờ được tính là phê duyệt.

## Adopting an existing project

`--adopt [path]` bắt đầu ở Phase 0. Lần chạy lập bản đồ những gì đã có thay vì làm lại:

1. **Khám phá** các plan, BRD, tài liệu thiết kế và code đã có cho task, cùng hướng dẫn và cấu hình build/test của dự án, trạng thái git, nhánh và lịch sử gần đây.
2. **Nhập mà không sửa**: các artifact dẫn xuất nằm trong `.zla-flow/`, giữ nguyên cách đánh số của bạn và ghi mỗi bản gốc làm nguồn của nó.
3. **Đánh giá kèm bằng chứng**, một nhãn cho mỗi phần:

| Label | Meaning |
|---|---|
| `done` | Đã xong, có bằng chứng trong repository. |
| `partial` | Làm một phần; báo cáo nêu còn thiếu gì. |
| `not_started` | Chưa bắt đầu. |
| `conflict` | Plan không còn khớp với code; cần bạn quyết định. |
| `unclear` | Không đủ thông tin để quyết định; cần bạn quyết định. |

4. **Kiểm tra BRD**: tóm tắt nó và liệt kê các khoảng trống, hoặc đề nghị viết một bản ngắn.
5. **Báo cáo và dừng ở GATE 0.**

Checkbox không được chấp nhận làm bằng chứng. Việc tiếp quản không bao giờ tự duyệt một BRD, một plan hay một review: các cổng đó vẫn đóng trừ khi bạn nói khác ở GATE 0, nêu tên cổng nào. Việc thực thi tiếp tục chỉ chạy các phần `not_started` và `partial`, và với phần `partial` coder được cho biết chính xác cái gì đã có và cái gì còn lại.

Khi `adopt.require_clean_tree` là true (mặc định) và cây làm việc có thay đổi chưa commit không liên quan, lần chạy báo chúng và dừng trước khi thực thi.

## Flags

| Flag | Meaning |
|---|---|
| `--setup` | Ghi hoặc làm mới `coder.json` từ provider và model của app. |
| `--approve-all` | Duyệt trước GATE 1, 2 và 3. Vẫn dừng khi có part lỗi, review chưa OK, model chưa resolve hoặc BRD chưa rõ. Không bao giờ commit hay push: bạn nói khi nào commit. |
| `--planner <use>` | Ai viết plan. |
| `--reviewer <use>` | Ai review. |
| `--coder model:<profile>[/<alias>]` | Coder profile cho lần chạy này, kèm alias model của profile đó nếu cần. |
| `--adopt [path]` | Tiếp quản một dự án đã có plan, BRD hoặc code. |
| `--resume <task-id>` | Tiếp tục một lần chạy bị gián đoạn từ file trạng thái của nó. |
| `--from <brd\|plan\|execute\|review>` | Bắt đầu từ phase đó khi các artifact trước đó đã có. |

`--from` không bao giờ bỏ qua một lần phê duyệt: `plan` cần GATE 1, `execute` cần GATE 1 và 2, còn `review` cần thêm các phần đã được thực thi. Cổng nào chưa được ghi trong file trạng thái của task này sẽ được trình bày lại, và lần chạy dừng ở đó. `--resume` đối chiếu file trạng thái với repository, tính phần đang `running` là thất bại, và tiếp tục ở phần đầu tiên chưa xong.

## Troubleshooting

| Symptom | Check |
|---|---|
| Mục ở thanh bên bị mất | Settings → Plugins: bundle `@zealamic/agent-plugin-flow-dsh` đã được bật. Sau khi bundle thay đổi, hãy tải lại trang. |
| `/zla-flow` không được đề xuất | Nửa Host nạp cùng tiến trình; hãy bật/tắt dòng plugin hoặc khởi động lại DSH, rồi bắt đầu một session mới. |
| Start không mở session nào | Trang mở workspace của session đang hiển thị, nếu không thì workspace gần nhất. Hãy mở một workspace trước. |
| Phase 3 dừng ngay lập tức | Không có coder lane: hãy kết nối một MCP coder, hoặc đặt một profile `coders.<name>` và trỏ `active` vào nó. |
| Model của profile bị từ chối | Alias trong `--coder model:<profile>/<alias>` phải là một khóa trong map `models` của profile đó. |

## Package layout

```text
packages/dsh/
├── package.json            bundle manifest (dsh.bundle.patch + dsh.client)
├── cordis.patch.yml        inserts the zla-flow row
├── index.js                Host half: the /zla-flow command
├── protocol.js             the protocol and usage line (generated from packages/core)
├── client.js               Client half: sidebar entry, page, styles
├── config/coder.example.json   starter project configuration (generated)
├── locale/en.json, locale/vi.json   Plugin Manager title and description
├── icon.svg                bundle icon (generated)
├── tests/bundle.test.mjs   offline checks (pnpm test), not shipped
└── README.md               this document
```

`protocol.js`, `config/coder.example.json`, `icon.svg` và khối `CODER_TEMPLATE` trong `client.js` được sinh ra từ [`packages/core`](https://github.com/zealamic/agent-plugin-flow/blob/main/packages/core/README.md): hãy sửa chúng ở đó rồi chạy `pnpm sync` ở thư mục gốc repository.

`pnpm check` xác nhận các file được sinh ra còn mới, mẫu `coder.json` nhúng khớp với `config/coder.example.json`, từ điển EN và VI có cùng các khóa, trang hiển thị được, và trình xử lý lệnh hoạt động đúng. Hãy chạy nó sau mọi chỉnh sửa.

## Limitations

- Trang này khởi chạy và ghi tài liệu cho lần chạy; nó không đọc các file trạng thái `.zla-flow`, nên tiến độ và các phê duyệt đang chờ nằm trong cuộc trò chuyện.
- Các cổng có hiệu lực vì model tuân theo giao thức. Không có hook nào ép buộc, nên hãy coi các dòng cổng là hợp đồng và từ chối một cách rõ ràng.
- Phase 3 cần một trong ba cơ chế coder ở trên. Khi không có, lần chạy dừng ở Phase 3 và nêu tên cơ chế còn thiếu; nó không bao giờ tự viết code.
- `coder.json` là một quy ước, không phải schema được kiểm tra. Gõ sai sẽ hiện ra như một lỗi của coder, không phải lỗi xác thực.
- Chỉ Phase 5 commit, và quy trình không bao giờ push.

## License

MIT © Zealamic. Viết bởi nqhed - Huy Ed. Nguyen.

Quy trình này giống hệt quy trình mà plugin Claude Code chạy; gói này là bản chuyển sang DeepSeek Harness. Trang có từ điển tiếng Anh và tiếng Việt (`locale/en.json`, `locale/vi.json`, và các từ điển của Client), vì plugin DSH theo ngôn ngữ đang hoạt động của người đọc.
