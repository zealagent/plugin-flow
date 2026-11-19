/**
 * Client half of the zlak-flow bundle.
 *
 * Registers one entry in the left sidebar (`sidebar.panellist`) and the page it
 * opens (`main`), keyed by the same id. The page seeds `/zlak-flow` into a new
 * Session and documents the workflow: vendor-neutral roles, coder lanes, flags,
 * limits and file layout.
 *
 * Plain JavaScript, no JSX: the browser module table provides React, every
 * visible string travels through the Client locale service, and styles use the
 * host theme tokens only.
 */
/** @type {any} */ (window).__ModuleLoader__.load({
  id: "@zealakit/agent-plugin-flow-dsh",
  factory(/** @type {(name: string) => any} */ moduleRequire) {
    const React = moduleRequire("react");
    const h = React.createElement;

    const NS = "zlak-flow";
    const PANEL_ID = "zlak-flow";

    /** The six phases, in order. Names are shared across locales. */
    const PHASES = ["p0", "p1", "p2", "p3", "p4", "p5"];
    /** Role grammar rows: the value is syntax, only the meaning is translated. */
    const ROLE_ROWS = [
      ["r0", "self"],
      ["r1", "subagent"],
      ["r2", "subagent:<provider>/<model>"],
      ["r3", "model:<profile>[/<alias>]"],
    ];
    /** Command flags: syntax is literal, meaning is translated. */
    const FLAG_ROWS = [
      ["f7", "--setup"],
      ["f8", "--approve-all"],
      ["f0", "--planner <use>"],
      ["f1", "--reviewer <use>"],
      ["f2", "--coder model:<profile>[/<alias>]"],
      ["f4", "--adopt [path]"],
      ["f5", "--resume <task-id>"],
      ["f6", "--from <phase>"],
    ];
    /** Transport lanes the coder configuration may declare. */
    const PROTOCOL_ROWS = [
      ["pt0", "anthropic"],
      ["pt1", "openai"],
      ["pt2", "command"],
      ["pt3", "host"],
    ];
    /** Size and runtime limits with their defaults. */
    const LIMIT_ROWS = [
      ["lm0", "plan_max_lines", "120"],
      ["lm1", "plan_max_steps", "8"],
      ["lm2", "plan_max_files_touched", "6"],
      ["lm3", "review_max_diff_lines", "600"],
      ["lm4", "max_concurrent_jobs", "1"],
      ["lm5", "job_prompt_max_chars", "24000"],
      ["lm6", "job_memory_limit_mb", "4096"],
    ];
    /** Where the run keeps its files. */
    const FILE_ROWS = [
      ["fl0", ".zlak-flow/coder.json"],
      ["fl1", ".zlak-flow/plans/<task-id>/"],
      ["fl2", ".zlak-flow/state/<task-id>.json"],
    ];
    /** Adoption evidence labels. */
    const ADOPT_ROWS = [
      ["ad0", "done"],
      ["ad1", "partial"],
      ["ad2", "not_started"],
      ["ad3", "conflict"],
      ["ad4", "unclear"],
    ];
    const RULES = ["rl0", "rl1", "rl2", "rl3", "rl4"];

    /**
     * Starter `.zlak-flow/coder.json`. Vendor-neutral: each lane names a
     * protocol and asks for the endpoint and model the user actually has.
     * Generated from packages/core/config/coder.example.json.
     */
    // @generated-start coder-template: packages/core/config/coder.example.json, run pnpm sync
    const CODER_TEMPLATE = `{
  "_readme": "Save as <project>/.zlak-flow/coder.json. 'active' is the default coder profile; override per run with --coder model:<profile>[/<alias>]. api_key_env is the NAME of an environment variable, never the key itself. 'protocol' is the transport: anthropic | openai | command. Any provider that speaks one of them works, and protocol 'host' names a provider the host app already holds (written by /zlak-flow --setup, no base_url or key). A profile may 'extends' another and override only what differs.",
  "version": 6,
  "active": "default",
  "fallback": [],
  "coders": {
    "default": {
      "protocol": "openai",
      "base_url": "REPLACE_WITH_BASE_URL",
      "api_key_env": "CODER_API_KEY",
      "model": "default",
      "models": { "default": "REPLACE_WITH_MODEL_ID" },
      "temperature": 0.2,
      "max_tokens": 8192,
      "timeout_seconds": 900
    },
    "anthropic-compatible": {
      "extends": "default",
      "protocol": "anthropic",
      "base_url": "REPLACE_WITH_ANTHROPIC_BASE_URL",
      "api_key_env": "CODER_API_KEY"
    },
    "cli": {
      "protocol": "command",
      "command": "REPLACE_WITH_CLI --model {model} --prompt-file {prompt_file}",
      "env": { "CODER_API_KEY": "\${CODER_API_KEY}" },
      "model": "default",
      "models": { "default": "REPLACE_WITH_MODEL_ID" },
      "timeout_seconds": 900
    }
  },
  "workspace": {
    "branch_prefix": "task/",
    "test_command": "REPLACE_WITH_TEST_COMMAND"
  },
  "roles": {
    "planner": { "use": "self" },
    "reviewer": { "use": "self", "verify_high_severity": true }
  },
  "limits": {
    "plan_max_lines": 120,
    "plan_max_steps": 8,
    "plan_max_files_touched": 6,
    "review_max_diff_lines": 600,
    "max_concurrent_jobs": 1,
    "job_prompt_max_chars": 24000,
    "job_memory_limit_mb": 4096
  },
  "adopt": {
    "plan_search_paths": [
      "plans",
      "docs/plans",
      "PLAN.md",
      "TODO.md",
      "ROADMAP.md"
    ],
    "brd_search_paths": ["docs/brd", "docs/requirements", "BRD.md", "PRD.md"],
    "context_files": ["README.md", "CONTRIBUTING.md", "AGENTS.md"],
    "ignore": ["node_modules", ".git", "dist", "build", ".venv", "vendor"],
    "require_clean_tree": true
  }
}
`;
    // @generated-end coder-template

    const EN = {
      panel: "zlak-flow",
      subtitle:
        "PM/Reviewer workflow: BRD, Plan, Execute, Review, Commit. The run stops at every gate and waits for you.",

      "start.heading": "Start a run",
      "start.task": "Task",
      "start.taskPlaceholder":
        "e.g. Add pagination to GET /orders, 100 rows max, with unit tests.",
      "start.coder": "Coder profile (optional)",
      "start.coderPlaceholder": "default",
      "start.model": "Model alias (optional)",
      "start.modelPlaceholder": "default",
      "start.primary": "Start in a new session",
      "start.copy": "Copy command",
      "start.copied": "Copied",
      "start.template": "Copy coder.json template",
      "start.hint":
        "The command opens in a new session; press Enter there to start. Any flag can also be typed into the task box.",
      "start.unavailable": "This window cannot open a new session.",
      "start.failed": "Could not copy or start.",
      "start.invalidField":
        "Coder profile and model alias must be a single word: no spaces or quotes, and not starting with a dash. A model alias needs a profile.",

      "phases.heading": "Phases and gates",
      "phases.phase": "Phase",
      "phases.work": "What happens",
      "phases.gate": "Gate",
      "phases.note":
        "This page is a launcher and a reference. Progress, plan parts and approvals live in the conversation.",
      "p0.name": "Adopt",
      "p0.work":
        "Scan existing plans, BRD and code; label every part with evidence. Read-only outside .zlak-flow/.",
      "p0.gate": "\u23f8 GATE 0",
      "p1.name": "BRD",
      "p1.work":
        "Goals, scope, out of scope, requirements, acceptance criteria, risks.",
      "p1.gate": "\u23f8 GATE 1",
      "p2.name": "Plan",
      "p2.work": "Numbered plan files, each small enough for one coder run.",
      "p2.gate": "\u23f8 GATE 2",
      "p3.name": "Execute",
      "p3.work":
        "One part at a time, in index order; stop at the first failure. No commits.",
      "p3.gate": "\u23f8 on failure only",
      "p4.name": "Review",
      "p4.work":
        "Read the real diff, one pass per part, every finding with file and line.",
      "p4.gate": "\u23f8 GATE 3",
      "p5.name": "Commit",
      "p5.work":
        "One git commit with a clear message; report the hash. Never a push.",
      "p5.gate": "after GATE 3",

      "roles.heading": "Roles and cost",
      "roles.intro":
        "Plan and Review can run here, or be delegated to a cheaper or different model. Nothing is pinned to a vendor: the workflow uses whichever providers this profile offers.",
      "roles.value": "Value",
      "roles.meaning": "Meaning",
      "r0.meaning":
        "This session does the work. The default, and the most expensive.",
      "r1.meaning":
        "A read-only subagent on this profile\u2019s default model.",
      "r2.meaning":
        "A read-only subagent on an explicit provider and model, e.g. subagent:openai/gpt-5.1 or subagent:deepseek/deepseek-chat.",
      "r3.meaning":
        "A read-only subagent on the model of a coder.json profile, optionally with an alias. Anthropic, OpenAI or host profiles only: a command profile edits files, so it cannot hold a role.",
      "roles.note":
        "A delegated role is read-only: no file edits, no git writes, no commits. Name the planner and reviewer at GATE 1 so they can be changed before anything is spent.",

      "flags.heading": "Flags",
      "flags.flag": "Flag",
      "flags.meaning": "Meaning",
      "f7.meaning":
        "Write or refresh coder.json from the providers and models this app already has. Run it once after install and again when you add a provider; it writes the file straight away, needs no approval, and never deletes a profile.",
      "f8.meaning":
        "Approve GATE 1, 2 and 3 up front for this run. It still stops on a failed part, a review that is not OK, an unresolved model, or an unclear BRD. It never commits or pushes: you say when to commit.",
      "f0.meaning": "Who writes the plan.",
      "f1.meaning": "Who reviews.",
      "f2.meaning":
        "Coder profile, optionally with a model alias, for this run; overrides the config default.",
      "f4.meaning":
        "Take over a project that already has plans, a BRD or code.",
      "f5.meaning": "Continue an interrupted run from its state file.",
      "f6.meaning": "Start at brd, plan, execute or review.",

      "config.heading": "Project configuration",
      "config.intro":
        "The run reads .zlak-flow/coder.json when it exists. It is a convention this workflow follows, not a file DSH validates; copy the template below and fill in the endpoint, model and environment variable name.",
      "config.protocol": "Protocol",
      "config.when": "Use it when",
      "pt0.meaning":
        "The provider speaks the Anthropic messages API, directly or through a proxy.",
      "pt1.meaning":
        "The provider speaks the OpenAI chat API: hosted APIs, gateways, vLLM, Ollama, LM Studio.",
      "pt2.meaning":
        "Any CLI on the machine: a vendor CLI, an agent CLI, or your own script. Placeholders: {model} {prompt_file} {workdir} {branch}.",
      "pt3.meaning":
        "A provider this app already holds, written by --setup: no base_url and no key, the app keeps the credentials.",
      "config.keys":
        "Only environment variable names go in the file (api_key_env). Never write a key, and never pass one through a prompt or a plan.",
      "config.extends":
        "A profile may extend another and override only what differs, so two plans of one provider share everything but the key or the model.",
      "config.fallback":
        "A fallback list is a menu, not an automatic switch: the run reports the failure and waits for you to choose.",

      "limits.heading": "Size and runtime limits",
      "limits.field": "Field",
      "limits.default": "Default",
      "limits.note":
        "The workflow splits plans to stay inside these; the runtime enforcement of memory and job count belongs to the host, not to this page.",

      "files.heading": "Where things live",
      "files.path": "Path",
      "files.purpose": "Purpose",
      "fl0.meaning": "Coder profiles, roles, limits and adoption paths.",
      "fl1.meaning": "The plan: 00-index.md plus one file per unit of work.",
      "fl2.meaning":
        "Progress of the current run, so --resume can continue it.",

      "adopt.heading": "Adopting an existing project",
      "adopt.intro":
        "With --adopt, the run first maps what already exists. Your originals are never edited, moved, renamed or deleted: derived files are written only under .zlak-flow/, keeping your numbering and naming each original as a source.",
      "adopt.label": "Label",
      "adopt.meaning": "Meaning",
      "ad0.meaning": "Done, with evidence in the repository.",
      "ad1.meaning": "Partly done; the report says what is missing.",
      "ad2.meaning": "Not started.",
      "ad3.meaning":
        "The plan no longer matches the code; your decision is required.",
      "ad4.meaning":
        "Not enough information to decide; your decision is required.",
      "adopt.note":
        "Checkboxes are not accepted as proof. Adoption never approves a BRD, a plan or a review: those gates stay closed unless you say otherwise at GATE 0.",

      "rules.heading": "Hard rules",
      "rl0.meaning":
        "A reject stops the run at that phase until you give new direction.",
      "rl1.meaning":
        "Only a clear approval for that gate counts; an ambiguous \u201cok\u201d is asked again.",
      "rl2.meaning":
        "No silent fallback to another coder, profile or model after a failure.",
      "rl3.meaning": "No commit or push before Phase 5.",
      "rl4.meaning":
        "Delegated roles stay read-only, and API keys never appear in prompts, plans or commits.",
      "footer.author": "Made by nqhed - Huy Ed. Nguyen",
    };

    const VI = {
      panel: "zlak-flow",
      subtitle:
        "Quy trình PM/Reviewer: BRD, Plan, Execute, Review, Commit. Mỗi cổng đều dừng lại chờ bạn.",

      "start.heading": "Bắt đầu một lần chạy",
      "start.task": "Task",
      "start.taskPlaceholder":
        "Ví dụ: Thêm phân trang cho GET /orders, tối đa 100 dòng, có unit test.",
      "start.coder": "Profile coder (không bắt buộc)",
      "start.coderPlaceholder": "default",
      "start.model": "Model alias (không bắt buộc)",
      "start.modelPlaceholder": "default",
      "start.primary": "Mở phiên mới",
      "start.copy": "Sao chép lệnh",
      "start.copied": "Đã sao chép",
      "start.template": "Sao chép mẫu coder.json",
      "start.hint":
        "Lệnh mở trong một phiên mới; nhấn Enter ở đó để bắt đầu. Cờ nào cũng có thể gõ ngay vào ô task.",
      "start.unavailable": "Cửa sổ này không mở được phiên mới.",
      "start.failed": "Không sao chép hoặc mở được.",
      "start.invalidField":
        "Profile coder và model alias phải là một từ: không có khoảng trắng hay dấu nháy, và không bắt đầu bằng dấu gạch ngang. Model alias cần có profile.",

      "phases.heading": "Các phase và cổng",
      "phases.phase": "Phase",
      "phases.work": "Việc làm",
      "phases.gate": "Cổng",
      "phases.note":
        "Trang này chỉ để khởi chạy và tra cứu. Tiến độ, các phần plan và việc duyệt nằm trong hội thoại.",
      "p0.name": "Adopt",
      "p0.work":
        "Quét plan, BRD và code có sẵn; gắn nhãn từng phần kèm bằng chứng. Chỉ đọc ngoài .zlak-flow/.",
      "p0.gate": "\u23f8 GATE 0",
      "p1.name": "BRD",
      "p1.work": "Mục tiêu, phạm vi, yêu cầu, tiêu chí nghiệm thu, rủi ro.",
      "p1.gate": "\u23f8 GATE 1",
      "p2.name": "Plan",
      "p2.work": "Các file plan đánh số, mỗi file đủ nhỏ cho một lượt coder.",
      "p2.gate": "\u23f8 GATE 2",
      "p3.name": "Execute",
      "p3.work":
        "Từng phần một, theo thứ tự; dừng ngay khi có lỗi. Không commit.",
      "p3.gate": "\u23f8 chỉ khi lỗi",
      "p4.name": "Review",
      "p4.work":
        "Đọc diff thật, mỗi phần một lượt, mỗi phát hiện ghi file và dòng.",
      "p4.gate": "\u23f8 GATE 3",
      "p5.name": "Commit",
      "p5.work":
        "Một lệnh git commit với thông điệp rõ ràng; báo lại hash. Không push.",
      "p5.gate": "sau GATE 3",

      "roles.heading": "Vai và chi phí",
      "roles.intro":
        "Plan và Review có thể làm ngay tại phiên này, hoặc giao cho một model rẻ hơn hay khác đi. Không ghim nhà cung cấp nào: quy trình dùng bất kỳ provider nào profile này có.",
      "roles.value": "Giá trị",
      "roles.meaning": "Ý nghĩa",
      "r0.meaning": "Phiên hiện tại làm. Mặc định, và tốn kém nhất.",
      "r1.meaning":
        "Một subagent chỉ đọc, chạy bằng model mặc định của profile.",
      "r2.meaning":
        "Subagent chỉ đọc trên provider và model chỉ định, ví dụ subagent:openai/gpt-5.1 hay subagent:deepseek/deepseek-chat.",
      "r3.meaning":
        "Subagent chỉ đọc chạy bằng model của một profile trong coder.json, kèm alias nếu cần. Chỉ profile anthropic, openai hoặc host: profile command sửa file nên không giữ vai được.",
      "roles.note":
        "Vai được giao chỉ có quyền đọc: không sửa file, không ghi git, không commit. Nêu planner và reviewer ngay ở GATE 1 để còn đổi trước khi tốn chi phí.",

      "flags.heading": "Cờ",
      "flags.flag": "Cờ",
      "flags.meaning": "Ý nghĩa",
      "f7.meaning":
        "Ghi hoặc làm mới coder.json từ các provider và model mà app đã có. Chạy một lần sau khi cài và chạy lại khi thêm provider; lệnh ghi file ngay, không cần duyệt và không bao giờ xóa profile.",
      "f8.meaning":
        "Duyệt trước GATE 1, 2 và 3 cho lần chạy này. Vẫn dừng khi có part lỗi, review chưa OK, model chưa resolve hoặc BRD chưa rõ. Không bao giờ commit hay push: bạn nói khi nào commit.",
      "f0.meaning": "Ai viết plan.",
      "f1.meaning": "Ai review.",
      "f2.meaning":
        "Profile coder, có thể kèm model alias, cho lần chạy này; thay giá trị mặc định.",
      "f4.meaning": "Tiếp nhận project đã có plan, BRD hoặc code.",
      "f5.meaning": "Chạy tiếp một lần chạy bị ngắt từ file trạng thái.",
      "f6.meaning": "Bắt đầu ở brd, plan, execute hoặc review.",

      "config.heading": "Cấu hình project",
      "config.intro":
        "Lần chạy đọc .zlak-flow/coder.json khi file đó có. Đây là quy ước của quy trình, không phải file DSH kiểm tra; hãy sao chép mẫu bên dưới rồi điền endpoint, model và tên biến môi trường.",
      "config.protocol": "Protocol",
      "config.when": "Dùng khi",
      "pt0.meaning":
        "Provider nói giao thức Anthropic messages, trực tiếp hoặc qua proxy.",
      "pt1.meaning":
        "Provider nói giao thức OpenAI chat: API hosted, gateway, vLLM, Ollama, LM Studio.",
      "pt2.meaning":
        "Bất kỳ CLI nào trên máy: CLI của hãng, CLI agent, hay script của bạn. Placeholder: {model} {prompt_file} {workdir} {branch}.",
      "pt3.meaning":
        "Provider mà app đã có sẵn, do --setup ghi: không có base_url và không có khóa, app giữ thông tin xác thực.",
      "config.keys":
        "Trong file chỉ ghi tên biến môi trường (api_key_env). Không ghi khóa, và không đưa khóa vào prompt hay plan.",
      "config.extends":
        "Một profile có thể extends profile khác và chỉ ghi phần khác, để hai gói của cùng provider dùng chung mọi thứ trừ khóa hoặc model.",
      "config.fallback":
        "Danh sách fallback là một menu, không phải tự động chuyển: lần chạy báo lỗi rồi chờ bạn chọn.",

      "limits.heading": "Giới hạn kích thước và tài nguyên",
      "limits.field": "Trường",
      "limits.default": "Mặc định",
      "limits.note":
        "Quy trình tự chia plan để nằm trong các giới hạn này; việc chặn RAM và số job thật sự do host thực hiện, không phải trang này.",

      "files.heading": "Các file của một lần chạy",
      "files.path": "Đường dẫn",
      "files.purpose": "Mục đích",
      "fl0.meaning":
        "Profile coder, các vai, giới hạn và đường dẫn tìm plan khi adopt.",
      "fl1.meaning": "Plan: 00-index.md và mỗi phần công việc một file.",
      "fl2.meaning": "Tiến độ lần chạy hiện tại, để --resume chạy tiếp.",

      "adopt.heading": "Tiếp nhận project có sẵn",
      "adopt.intro":
        "Với --adopt, lần chạy lập bản đồ những gì đã có trước. File gốc của bạn không bị sửa, di chuyển, đổi tên hay xóa: file dẫn xuất chỉ ghi trong .zlak-flow/, giữ nguyên số thứ tự và ghi rõ nguồn.",
      "adopt.label": "Nhãn",
      "adopt.meaning": "Ý nghĩa",
      "ad0.meaning": "Đã xong, có bằng chứng trong repo.",
      "ad1.meaning": "Làm dở; báo cáo nói rõ còn thiếu gì.",
      "ad2.meaning": "Chưa làm.",
      "ad3.meaning": "Plan không còn khớp code; cần bạn quyết.",
      "ad4.meaning": "Không đủ thông tin để kết luận; cần bạn quyết.",
      "adopt.note":
        "Dấu tích không được coi là bằng chứng. Tiếp nhận không đồng nghĩa đã duyệt BRD, plan hay review: các cổng đó vẫn đóng trừ khi bạn nói rõ ở GATE 0.",

      "rules.heading": "Ràng buộc cốt lõi",
      "rl0.meaning":
        "Bạn reject ở phase nào thì dừng ngay ở phase đó và chờ chỉ thị mới.",
      "rl1.meaning":
        "Chỉ lời duyệt rõ ràng cho đúng cổng mới tính; câu mơ hồ sẽ được hỏi lại.",
      "rl2.meaning": "Không tự đổi coder, profile hay model sau khi lỗi.",
      "rl3.meaning": "Không commit hay push trước Phase 5.",
      "rl4.meaning":
        "Vai được giao chỉ đọc, và khóa API không bao giờ xuất hiện trong prompt, plan hay commit.",
      "footer.author": "Tạo bởi nqhed - Huy Ed. Nguyen",
    };

    const ZH = {
      panel: "zlak-flow",
      subtitle:
        "PM/Reviewer 工作流：BRD、Plan、Execute、Review、Commit。运行会在每个关卡停下，等待你的决定。",

      "start.heading": "开始一次运行",
      "start.task": "Task",
      "start.taskPlaceholder":
        "例如：为 GET /orders 添加分页，最多 100 行，并编写单元测试。",
      "start.coder": "Coder profile（可选）",
      "start.coderPlaceholder": "default",
      "start.model": "Model alias（可选）",
      "start.modelPlaceholder": "default",
      "start.primary": "在新会话中开始",
      "start.copy": "复制命令",
      "start.copied": "已复制",
      "start.template": "复制 coder.json 模板",
      "start.hint":
        "命令会在新会话中打开；在那里按 Enter 开始。任何参数也可以直接输入到 task 框中。",
      "start.unavailable": "此窗口无法打开新会话。",
      "start.failed": "无法复制或启动。",
      "start.invalidField":
        "Coder profile 和 model alias 必须是单个词：不能有空格或引号，也不能以连字符开头。填写 model alias 时必须同时填写 profile。",

      "phases.heading": "各 Phase 与关卡",
      "phases.phase": "Phase",
      "phases.work": "做什么",
      "phases.gate": "关卡",
      "phases.note":
        "本页只用于启动和查阅。进度、plan 各部分和审批都在对话中进行。",
      "p0.name": "Adopt",
      "p0.work":
        "扫描现有的 plan、BRD 和代码；为每个部分标注证据。在 .zlak-flow/ 之外只读。",
      "p0.gate": "⏸ GATE 0",
      "p1.name": "BRD",
      "p1.work": "目标、范围、范围之外、需求、验收标准、风险。",
      "p1.gate": "⏸ GATE 1",
      "p2.name": "Plan",
      "p2.work": "编号的 plan 文件，每个都小到足够一次 coder 运行完成。",
      "p2.gate": "⏸ GATE 2",
      "p3.name": "Execute",
      "p3.work": "按索引顺序一次一个部分；遇到第一次失败就停止。不提交。",
      "p3.gate": "⏸ 仅在失败时",
      "p4.name": "Review",
      "p4.work": "阅读真实的 diff，每个部分一遍，每条发现都附上文件和行号。",
      "p4.gate": "⏸ GATE 3",
      "p5.name": "Commit",
      "p5.work": "一次带清晰说明的 git commit；报告哈希。绝不 push。",
      "p5.gate": "GATE 3 之后",

      "roles.heading": "角色与成本",
      "roles.intro":
        "Plan 和 Review 可以在这里运行，也可以委派给更便宜或不同的模型。没有任何内容绑定到特定供应商：工作流使用此 profile 提供的任何 provider。",
      "roles.value": "取值",
      "roles.meaning": "含义",
      "r0.meaning": "由本会话完成。默认值，成本最高。",
      "r1.meaning": "使用此 profile 默认模型的只读 subagent。",
      "r2.meaning":
        "使用明确 provider 和模型的只读 subagent，例如 subagent:openai/gpt-5.1 或 subagent:deepseek/deepseek-chat。",
      "r3.meaning":
        "使用某个 coder.json profile 的模型（可带别名）的只读 subagent。仅限 Anthropic、OpenAI 或 host profile：command profile 会编辑文件，因此不能担任角色。",
      "roles.note":
        "被委派的角色是只读的：不编辑文件、不写 git、不提交。请在 GATE 1 指定 planner 和 reviewer，以便在花费任何成本之前修改。",

      "flags.heading": "参数",
      "flags.flag": "参数",
      "flags.meaning": "含义",
      "f7.meaning":
        "根据本应用已有的 provider 和模型写入或刷新 coder.json。安装后运行一次，添加 provider 后再运行；它会立即写入文件，无需批准，也从不删除 profile。",
      "f8.meaning":
        "为本次运行预先批准 GATE 1、2 和 3。遇到失败的部分、未通过的 review、未解析的模型或不清楚的 BRD 时仍会停止。它从不提交或 push：何时提交由你决定。",
      "f0.meaning": "谁来写 plan。",
      "f1.meaning": "谁来 review。",
      "f2.meaning":
        "本次运行的 coder profile，可带 model alias；覆盖配置中的默认值。",
      "f4.meaning": "接手已经有 plan、BRD 或代码的项目。",
      "f5.meaning": "从状态文件继续被中断的运行。",
      "f6.meaning": "从 brd、plan、execute 或 review 开始。",

      "config.heading": "项目配置",
      "config.intro":
        "运行时会在 .zlak-flow/coder.json 存在时读取它。这是本工作流遵循的约定，不是 DSH 校验的文件；请复制下面的模板，并填写端点、模型和环境变量名称。",
      "config.protocol": "Protocol",
      "config.when": "适用场景",
      "pt0.meaning":
        "provider 使用 Anthropic messages API，直接使用或经由代理。",
      "pt1.meaning":
        "provider 使用 OpenAI chat API：托管 API、网关、vLLM、Ollama、LM Studio。",
      "pt2.meaning":
        "机器上的任何 CLI：厂商 CLI、agent CLI 或你自己的脚本。占位符：{model} {prompt_file} {workdir} {branch}。",
      "pt3.meaning":
        "本应用已持有的 provider，由 --setup 写入：没有 base_url 也没有 key，凭据由应用保管。",
      "config.keys":
        "文件中只写环境变量的名称（api_key_env）。绝不写入 key，也绝不通过 prompt 或 plan 传递 key。",
      "config.extends":
        "一个 profile 可以扩展另一个并只覆盖不同之处，因此同一 provider 的两个套餐除 key 或模型外共享一切。",
      "config.fallback":
        "fallback 列表是菜单，而不是自动切换：运行会报告失败并等你选择。",

      "limits.heading": "大小与运行限制",
      "limits.field": "字段",
      "limits.default": "默认值",
      "limits.note":
        "工作流会拆分 plan 以保持在这些限制之内；内存和任务数的运行时强制执行由宿主负责，而不是本页。",

      "files.heading": "文件位置",
      "files.path": "路径",
      "files.purpose": "用途",
      "fl0.meaning": "Coder profile、角色、限制和 adopt 路径。",
      "fl1.meaning": "Plan：00-index.md 加上每个工作单元一个文件。",
      "fl2.meaning": "当前运行的进度，使 --resume 可以继续。",

      "adopt.heading": "接手现有项目",
      "adopt.intro":
        "使用 --adopt 时，运行会先梳理已有的内容。你的原始文件绝不会被编辑、移动、重命名或删除：派生文件只写在 .zlak-flow/ 下，保留你的编号，并把每个原始文件标明为来源。",
      "adopt.label": "标签",
      "adopt.meaning": "含义",
      "ad0.meaning": "已完成，仓库中有证据。",
      "ad1.meaning": "部分完成；报告会说明缺少什么。",
      "ad2.meaning": "尚未开始。",
      "ad3.meaning": "plan 与代码不再一致；需要你来决定。",
      "ad4.meaning": "信息不足，无法判断；需要你来决定。",
      "adopt.note":
        "复选框不被接受为证据。接手从不批准 BRD、plan 或 review：这些关卡保持关闭，除非你在 GATE 0 明确说明。",

      "rules.heading": "硬性规则",
      "rl0.meaning": "reject 会让运行停在该 phase，直到你给出新的指示。",
      "rl1.meaning": "只有对该关卡的明确批准才算数；含糊的“好”会被再次询问。",
      "rl2.meaning": "失败后绝不悄悄回退到另一个 coder、profile 或模型。",
      "rl3.meaning": "在 Phase 5 之前不提交也不 push。",
      "rl4.meaning":
        "被委派的角色保持只读，API key 绝不出现在 prompt、plan 或 commit 中。",
      "footer.author": "作者 nqhed - Huy Ed. Nguyen",
    };

    const CSS = `
.zlak-page{display:flex;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);font-size:14px;line-height:1.6}
.zlak-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable}
.zlak-content{max-width:960px;margin:0 auto;padding:0 clamp(20px,4vw,40px) 48px;box-sizing:border-box}
.zlak-head{padding-top:28px;margin-bottom:20px}
.zlak-head h1{margin:0;font-size:20px;line-height:28px;font-weight:500}
.zlak-sub{margin:6px 0 0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.zlak-card{margin-top:16px;padding:16px 18px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.zlak-card h2{margin:0 0 12px;font-size:14px;line-height:22px;font-weight:600}
.zlak-card p{margin:0 0 10px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.zlak-card p:last-child{margin-bottom:0}
.zlak-field{display:grid;gap:6px;font-size:13px;min-width:0}
.zlak-field>span{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.zlak-field textarea,.zlak-field input{width:100%;box-sizing:border-box;padding:8px 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:20px}
.zlak-field textarea{resize:vertical;min-height:64px}
.zlak-field textarea::placeholder,.zlak-field input::placeholder{color:var(--dsw-alias-label-secondary)}
.zlak-field textarea:focus,.zlak-field input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.zlak-field input[aria-invalid="true"]{border-color:var(--dsw-alias-state-error-primary)}
.zlak-row{display:flex;gap:12px;margin-top:12px}
.zlak-half{flex:1;min-width:0}
.zlak-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.zlak-primary,.zlak-ghost{height:32px;padding:0 14px;border-radius:16px;font-family:inherit;font-size:13px;line-height:20px;cursor:pointer}
.zlak-primary{border:0;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-color,#fff)}
.zlak-primary:disabled{opacity:.45;cursor:not-allowed}
.zlak-ghost{border:0.5px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary)}
.zlak-ghost:hover:not(:disabled){border-color:var(--dsw-alias-border-l1)}
.zlak-ghost:disabled{opacity:.45;cursor:not-allowed}
.zlak-warn{margin:10px 0 0;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}
.zlak-table{width:100%;border-collapse:collapse;font-size:13px;line-height:20px}
.zlak-table th{text-align:left;font-weight:500;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;padding:0 12px 6px 0;border-bottom:0.5px solid var(--dsw-alias-border-l1);white-space:nowrap}
.zlak-table td{padding:8px 12px 8px 0;vertical-align:top;border-bottom:0.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.zlak-table tbody tr:last-child td{border-bottom:0;padding-bottom:0}
.zlak-table td:first-child{color:var(--dsw-alias-label-primary)}
.zlak-table td:last-child,.zlak-table th:last-child{padding-right:0}
.zlak-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;white-space:nowrap}
.zlak-hint{margin:10px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.zlak-list{margin:0;padding-left:18px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.zlak-list li+li{margin-top:4px}
.zlak-note{margin-top:10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.zlak-foot{margin:20px 0 0;text-align:center;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
@media (max-width:640px){.zlak-row{flex-direction:column}.zlak-table td,.zlak-table th{padding-right:8px}.zlak-mono{white-space:normal;overflow-wrap:anywhere}}
`;

    /**
     * Sidebar cell glyph: a checklist, drawn in the row's own color.
     * @param props - the sidebar's icon share: requested edge and selection.
     * @returns the decorative icon.
     */
    function PanelIcon(props) {
      const size = typeof props.size === "number" ? props.size : 20;
      const stroke = {
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
      };
      return h(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 20 20",
          "aria-hidden": true,
          focusable: "false",
          display: "block",
        },
        h("path", Object.assign({ d: "M3.5 5.25 5 6.75 7.25 4" }, stroke)),
        h("path", Object.assign({ d: "M9.5 5.75h7" }, stroke)),
        h("path", Object.assign({ d: "M3.5 10.5 5 12 7.25 9.25" }, stroke)),
        h("path", Object.assign({ d: "M9.5 11h7" }, stroke)),
        h("path", Object.assign({ d: "M3.5 15.75 5 17.25 7.25 14.5" }, stroke)),
        h("path", Object.assign({ d: "M9.5 16.25h7" }, stroke)),
      );
    }

    /**
     * A coder profile or model alias must be one flag value: no spaces, no
     * quotes, and not starting with a dash, so it cannot split into extra flags.
     */
    const TOKEN = /^[A-Za-z0-9_.:/@+][A-Za-z0-9_.:/@+-]*$/;

    /**
     * Whether an optional field value is usable as a single flag value.
     * @param value - the raw field text.
     * @returns true when empty or a valid token.
     */
    function isToken(value) {
      const text = value.trim();
      return text.length === 0 || TOKEN.test(text);
    }

    /**
     * Build the command line the page seeds into a Session.
     * @param task - the task text.
     * @param coder - optional coder profile.
     * @param model - optional model alias.
     * @returns the complete `/zlak-flow` line.
     */
    function commandLine(task, coder, model) {
      const parts = ["/zlak-flow"];
      const profile = coder.trim();
      const alias = model.trim();
      if (profile.length > 0) {
        parts.push(
          "--coder",
          `model:${profile}${alias.length > 0 ? `/${alias}` : ""}`,
        );
      }
      const body = task.trim();
      if (body.length > 0) parts.push(body);
      return parts.join(" ");
    }

    /**
     * Write text to the clipboard.
     * @param text - the text to copy.
     * @returns resolution once the text is on the clipboard.
     */
    function copyText(text) {
      const clipboard =
        globalThis.navigator === undefined
          ? undefined
          : globalThis.navigator.clipboard;
      if (
        clipboard === undefined ||
        typeof clipboard.writeText !== "function"
      ) {
        return Promise.reject(new Error("clipboard unavailable"));
      }
      return clipboard.writeText(text);
    }

    /**
     * The zlak-flow page: seed a run, then read the workflow it will follow.
     * @param props - slot props, plus this plugin's injected translate and start face.
     * @returns the page.
     */
    function Panel(props) {
      const t = typeof props.t === "function" ? props.t : props.zlakT;
      const start = props.zlakStart;
      const taskState = React.useState("");
      const task = taskState[0];
      const setTask = taskState[1];
      const profileState = React.useState("");
      const profile = profileState[0];
      const setProfile = profileState[1];
      const aliasState = React.useState("");
      const alias = aliasState[0];
      const setAlias = aliasState[1];
      const copiedState = React.useState("");
      const copied = copiedState[0];
      const setCopied = copiedState[1];
      const failureState = React.useState("");
      const failure = failureState[0];
      const setFailure = failureState[1];

      const timerRef = React.useRef(undefined);
      React.useEffect(
        () => () => globalThis.clearTimeout(timerRef.current),
        [],
      );

      const line = commandLine(task, profile, alias);
      const hasTask = task.trim().length > 0;
      const profileOk = isToken(profile);
      const aliasOk = isToken(alias);
      const fieldsOk =
        profileOk &&
        aliasOk &&
        (alias.trim().length === 0 || profile.trim().length > 0);
      const canRun = hasTask && fieldsOk;

      /** Copy one payload and flash which button succeeded. */
      const copy = (what, text) => {
        copyText(text).then(
          () => {
            globalThis.clearTimeout(timerRef.current);
            setCopied(what);
            setFailure("");
            timerRef.current = globalThis.setTimeout(() => setCopied(""), 2000);
          },
          () => setFailure(t("start.failed")),
        );
      };

      const onStart = () => {
        if (!canRun) return;
        try {
          const outcome = start(line);
          if (outcome === false) {
            setFailure(t("start.unavailable"));
            return;
          }
          setFailure("");
          if (
            outcome !== null &&
            typeof outcome === "object" &&
            typeof outcome.then === "function"
          ) {
            outcome.then(undefined, () => setFailure(t("start.failed")));
          }
        } catch {
          setFailure(t("start.failed"));
        }
      };

      const card = (key, title, ...body) =>
        h(
          "section",
          { key, className: "zlak-card" },
          h("h2", null, title),
          ...body,
        );

      const table = (key, headers, rows) =>
        h(
          "table",
          { key, className: "zlak-table" },
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              headers.map((label, index) =>
                h("th", { key: index, scope: "col" }, label),
              ),
            ),
          ),
          h(
            "tbody",
            null,
            rows.map((row) =>
              h(
                "tr",
                { key: row.key },
                row.cells.map((cell, index) =>
                  h(
                    "td",
                    {
                      key: index,
                      className: cell.mono === true ? "zlak-mono" : undefined,
                    },
                    cell.text,
                  ),
                ),
              ),
            ),
          ),
        );

      const sentence = (key) => h("p", { key }, t(key));
      const note = (key) => h("p", { key, className: "zlak-note" }, t(key));

      const launch = card(
        "launch",
        t("start.heading"),
        h(
          "label",
          { key: "task", className: "zlak-field" },
          h("span", null, t("start.task")),
          h("textarea", {
            value: task,
            rows: 3,
            placeholder: t("start.taskPlaceholder"),
            onChange: (event) => setTask(event.target.value),
          }),
        ),
        h(
          "div",
          { key: "row", className: "zlak-row" },
          h(
            "label",
            { key: "coder", className: "zlak-field zlak-half" },
            h("span", null, t("start.coder")),
            h("input", {
              type: "text",
              value: profile,
              spellCheck: false,
              "aria-invalid": profileOk ? undefined : true,
              placeholder: t("start.coderPlaceholder"),
              onChange: (event) => setProfile(event.target.value),
            }),
          ),
          h(
            "label",
            { key: "model", className: "zlak-field zlak-half" },
            h("span", null, t("start.model")),
            h("input", {
              type: "text",
              value: alias,
              spellCheck: false,
              "aria-invalid": aliasOk ? undefined : true,
              placeholder: t("start.modelPlaceholder"),
              onChange: (event) => setAlias(event.target.value),
            }),
          ),
        ),
        h(
          "div",
          { key: "actions", className: "zlak-actions" },
          h(
            "button",
            {
              key: "start",
              className: "zlak-primary",
              type: "button",
              disabled: !canRun,
              onClick: onStart,
            },
            t("start.primary"),
          ),
          h(
            "button",
            {
              key: "copy",
              className: "zlak-ghost",
              type: "button",
              disabled: !canRun,
              onClick: () => copy("command", line),
            },
            copied === "command" ? t("start.copied") : t("start.copy"),
          ),
          h(
            "button",
            {
              key: "template",
              className: "zlak-ghost",
              type: "button",
              onClick: () => copy("template", CODER_TEMPLATE),
            },
            copied === "template" ? t("start.copied") : t("start.template"),
          ),
        ),
        h("p", { key: "hint", className: "zlak-hint" }, t("start.hint")),
        fieldsOk
          ? null
          : h(
              "p",
              { key: "invalid", className: "zlak-warn", role: "alert" },
              t("start.invalidField"),
            ),
        failure.length === 0
          ? null
          : h(
              "p",
              { key: "failure", className: "zlak-warn", role: "alert" },
              failure,
            ),
      );

      const phases = card(
        "phases",
        t("phases.heading"),
        table(
          "phases-table",
          [t("phases.phase"), t("phases.work"), t("phases.gate")],
          PHASES.map((key) => ({
            key,
            cells: [
              { text: t(key + ".name") },
              { text: t(key + ".work") },
              { text: t(key + ".gate"), mono: true },
            ],
          })),
        ),
        note("phases.note"),
      );

      const roles = card(
        "roles",
        t("roles.heading"),
        sentence("roles.intro"),
        table(
          "roles-table",
          [t("roles.value"), t("roles.meaning")],
          ROLE_ROWS.map(([key, syntax]) => ({
            key,
            cells: [
              { text: syntax, mono: true },
              { text: t(key + ".meaning") },
            ],
          })),
        ),
        note("roles.note"),
      );

      const flags = card(
        "flags",
        t("flags.heading"),
        table(
          "flags-table",
          [t("flags.flag"), t("flags.meaning")],
          FLAG_ROWS.map(([key, syntax]) => ({
            key,
            cells: [
              { text: syntax, mono: true },
              { text: t(key + ".meaning") },
            ],
          })),
        ),
      );

      const config = card(
        "config",
        t("config.heading"),
        sentence("config.intro"),
        table(
          "protocol-table",
          [t("config.protocol"), t("config.when")],
          PROTOCOL_ROWS.map(([key, syntax]) => ({
            key,
            cells: [
              { text: syntax, mono: true },
              { text: t(key + ".meaning") },
            ],
          })),
        ),
        sentence("config.keys"),
        sentence("config.extends"),
        sentence("config.fallback"),
      );

      const limits = card(
        "limits",
        t("limits.heading"),
        table(
          "limits-table",
          [t("limits.field"), t("limits.default")],
          LIMIT_ROWS.map(([key, field, value]) => ({
            key,
            cells: [
              { text: field, mono: true },
              { text: value, mono: true },
            ],
          })),
        ),
        note("limits.note"),
      );

      const files = card(
        "files",
        t("files.heading"),
        table(
          "files-table",
          [t("files.path"), t("files.purpose")],
          FILE_ROWS.map(([key, path]) => ({
            key,
            cells: [{ text: path, mono: true }, { text: t(key + ".meaning") }],
          })),
        ),
      );

      const adopt = card(
        "adopt",
        t("adopt.heading"),
        sentence("adopt.intro"),
        table(
          "adopt-table",
          [t("adopt.label"), t("adopt.meaning")],
          ADOPT_ROWS.map(([key, label]) => ({
            key,
            cells: [{ text: label, mono: true }, { text: t(key + ".meaning") }],
          })),
        ),
        note("adopt.note"),
      );

      const rules = card(
        "rules",
        t("rules.heading"),
        h(
          "ul",
          { key: "list", className: "zlak-list" },
          RULES.map((key) => h("li", { key }, t(key + ".meaning"))),
        ),
      );

      return h(
        "div",
        { className: "zlak-page" },
        h(
          "div",
          { className: "zlak-scroll" },
          h(
            "div",
            { className: "zlak-content" },
            h(
              "header",
              { className: "zlak-head" },
              h("h1", null, t("panel")),
              h("p", { className: "zlak-sub" }, t("subtitle")),
            ),
            launch,
            phases,
            roles,
            flags,
            config,
            limits,
            files,
            adopt,
            rules,
            h(
              "p",
              { key: "author", className: "zlak-foot" },
              t("footer.author"),
            ),
          ),
        ),
      );
    }

    return {
      inject: ["slots", "locale"],
      apply(ctx) {
        ctx.effect(() => {
          const element = document.createElement("style");
          element.dataset.zlakFlow = "";
          element.textContent = CSS;
          document.head.appendChild(element);
          return () => {
            element.remove();
          };
        }, "zlak-flow: styles");

        ctx.effect(
          () => ctx.locale.register(NS, { en: EN, vi: VI, zh: ZH }),
          "zlak-flow: dictionaries",
        );

        const t = ctx.locale.bind(NS);

        /**
         * Seed the command into a new Session.
         * @returns false when this window cannot, the host's promise when it
         * returns one (so the page can report a rejection), else true.
         */
        const start = (line) => {
          const uiWorkspace = ctx.get("uiWorkspace");
          if (
            uiWorkspace === undefined ||
            typeof uiWorkspace.startSession !== "function"
          )
            return false;
          const pending = uiWorkspace.startSession(undefined, {
            prompt: line,
            whenDraftExists: "append",
          });
          return pending !== null &&
            typeof pending === "object" &&
            typeof pending.then === "function"
            ? pending
            : true;
        };

        ctx.effect(
          () =>
            ctx.slots.inject("main", () =>
              ctx.slots.register(
                {
                  name: "main",
                  key: PANEL_ID,
                  locale: NS,
                  inject: () => ({ zlakT: t, zlakStart: start }),
                },
                Panel,
              ),
            ),
          "zlak-flow: main panel",
        );

        ctx.effect(
          () =>
            ctx.slots.inject("sidebar.panellist", () =>
              ctx.slots.register(
                {
                  name: "sidebar.panellist",
                  id: PANEL_ID,
                  order: 20,
                  locale: NS,
                  label: () => t("panel"),
                },
                PanelIcon,
              ),
            ),
          "zlak-flow: sidebar entry",
        );
      },
    };
  },
});
