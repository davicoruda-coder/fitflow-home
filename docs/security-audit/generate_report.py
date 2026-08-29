#!/usr/bin/env python3
"""Gera o Relatório de Auditoria de Segurança (PDF A4) do FitFlow Home."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
OUT_PDF = ROOT / "relatorio-auditoria-seguranca.pdf"
CHART_DIR = ROOT / "_charts"
PREVIEW_DIR = ROOT / "_preview"
FINDINGS_PATH = ROOT / "findings.json"

PALETTE = {
    "crítica": "#B91C1C",
    "alta": "#EA580C",
    "média": "#D97706",
    "baixa": "#2563EB",
    "informativa": "#6B7280",
    "ponto forte": "#059669",
}
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#4B5563")
LINE = colors.HexColor("#E5E7EB")
BG_SOFT = colors.HexColor("#F3F4F6")
BRAND = colors.HexColor("#127A52")

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm


def load_findings() -> dict:
    return json.loads(FINDINGS_PATH.read_text(encoding="utf-8"))


def styles() -> dict:
    base = getSampleStyleSheet()
    s = {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=BRAND,
            tracking=1.2,
            spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=12,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=INK,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.5,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
            spaceAfter=4,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=INK,
        ),
        "chip": ParagraphStyle(
            "chip",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            textColor=colors.white,
        ),
        "code": ParagraphStyle(
            "code",
            parent=base["Code"],
            fontName="Courier",
            fontSize=7.5,
            leading=10,
            textColor=INK,
            backColor=BG_SOFT,
            leftIndent=4,
            rightIndent=4,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "issue": ParagraphStyle(
            "issue",
            parent=base["Normal"],
            fontName="Courier",
            fontSize=7.2,
            leading=9.6,
            textColor=INK,
        ),
    }
    return s


def header_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(BRAND)
    canvas.rect(0, PAGE_H - 0.35 * cm, PAGE_W, 0.35 * cm, fill=1, stroke=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(MARGIN, PAGE_H - 1.15 * cm, "Relatório de Auditoria de Segurança — FitFlow Home")
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.15 * cm, "Confidencial · uso interno")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN, PAGE_H - 1.35 * cm, PAGE_W - MARGIN, PAGE_H - 1.35 * cm)
    canvas.line(MARGIN, 1.35 * cm, PAGE_W - MARGIN, 1.35 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(MARGIN, 0.85 * cm, "docs/security-audit")
    canvas.drawRightString(PAGE_W - MARGIN, 0.85 * cm, f"Página {doc.page}")
    canvas.restoreState()


def chip_color(severity: str):
    hex_color = PALETTE.get(severity, "#2563EB")
    return colors.HexColor(hex_color)


def make_charts(data: dict) -> tuple[Path, Path]:
    CHART_DIR.mkdir(exist_ok=True)
    findings = data["findings"]
    counts = {"crítica": 0, "alta": 0, "média": 0, "baixa": 0, "informativa": 0}
    by_cat: dict[str, int] = {}
    for f in findings:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
        by_cat[f["category"]] = by_cat.get(f["category"], 0) + 1

    labels = [k for k, v in counts.items() if v]
    values = [counts[k] for k in labels]
    pie_colors = [PALETTE[k] for k in labels]

    fig, ax = plt.subplots(figsize=(4.2, 4.2), dpi=140)
    wedges, *_ = ax.pie(
        values,
        colors=pie_colors,
        startangle=90,
        wedgeprops=dict(width=0.42, edgecolor="white"),
    )
    ax.legend(
        wedges,
        [f"{k} ({counts[k]})" for k in labels],
        loc="lower center",
        bbox_to_anchor=(0.5, -0.08),
        frameon=False,
        fontsize=8,
    )
    ax.set_title("Achados por severidade", fontsize=11, pad=8)
    donut = CHART_DIR / "severidade.png"
    fig.tight_layout()
    fig.savefig(donut, bbox_inches="tight", facecolor="white")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(5.4, 3.4), dpi=140)
    cats = list(by_cat.keys())
    vals = [by_cat[c] for c in cats]
    ax.barh(cats, vals, color="#127A52")
    ax.set_xlabel("Quantidade")
    ax.set_title("Achados por categoria", fontsize=11)
    ax.set_xlim(0, max(vals) + 1)
    for i, v in enumerate(vals):
        ax.text(v + 0.05, i, str(v), va="center", fontsize=8)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    bars = CHART_DIR / "categorias.png"
    fig.tight_layout()
    fig.savefig(bars, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return donut, bars


def p(text: str, style) -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), style)


ISSUE_1 = """--- ISSUE 1 ---
# [Segurança] Ativar proteção contra senhas vazadas no Supabase Auth

**Labels sugeridas:** `security`, `média`

## Problema
O advisor de segurança do projeto Supabase (`beaokkxdhdpasarlzdzf`) reporta *Leaked Password Protection Disabled*. O app só exige 8 caracteres (`src/lib/validation.ts`, `PASSWORD_MIN`).

## Por que é explorável
No signup (`SignupForm`) e na troca/redefinição de senha, uma senha já vazada (ex.: listas do HaveIBeenPwned) é aceita se tiver ≥ 8 caracteres. Isso facilita takeover se o e-mail da vítima reaparecer em outro vazamento.

## Evidência
- Advisor: `auth_leaked_password_protection` (WARN, facing EXTERNAL)
- Remediação oficial: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- `src/lib/validation.ts` linhas 51–56 — apenas comprimento

## Impacto
Contas com senha fraca/vazada; risco médio em app pessoal, maior se o e-mail for reutilizado.

## Sugestão de correção
1. No dashboard Supabase → Authentication → Settings, ativar *Leaked password protection*.
2. Opcional: política de senha mais forte (mínimo 10–12, ou check no servidor).

## Critérios de aceite
- [ ] Advisor `auth_leaked_password_protection` deixa de aparecer (ou fica resolvido)
- [ ] Signup com senha conhecida como vazada é rejeitado pelo Auth
--- FIM ISSUE 1 ---"""

ISSUE_2 = """--- ISSUE 2 ---
# [Segurança] Proxy de auth falha aberto e layout (app) não revalida sessão

**Labels sugeridas:** `security`, `baixa`

## Problema
Três pontos fracos se somam: o proxy não autentica se as env do Supabase faltarem; o layout autenticado não chama `requireUser`; `/descanso` também não.

## Por que é explorável
Com `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` ausentes, `updateSession` devolve `NextResponse.next()` sem redirecionar para login. `/descanso` fica público (hoje só texto estático). Uma página nova no grupo `(app)` sem `requireUser` herdaria o furo.

## Evidência
```
// src/lib/supabase/proxy.ts:10-12
if (!url || !anonKey) {
  return supabaseResponse;
}
```
```
// src/app/(app)/layout.tsx — sem getUser/requireUser
export default function AppLayout({ children }) { ... }
```
```
// src/app/(app)/descanso/page.tsx:8
export default function DescansoPage() { // sem requireUser
```
`src/lib/supabase/client.ts:3-8` e `server.ts` usam `!` sem validar placeholder.

## Impacto
Baixo no estado atual: `/hoje`, `/historico`, `/perfil`, `/treino/[code]` ainda redirecionam via `requireUser`. Produção hoje tem env. Risco sobe em misconfig ou página nova.

## Sugestão de correção
1. Se env faltar: falhar fechado (503 ou redirect `/login`), não `next()`.
2. Validar URL/key no boot (rejeitar `YOUR_PROJECT` / `your_anon_key`).
3. `requireUser()` no layout `(app)` (ou helper compartilhado).

## Critérios de aceite
- [ ] Teste com env vazia: rotas `(app)` não entregam 200 autenticado
- [ ] `/descanso` exige sessão ou sai do grupo autenticado de propósito documentada
- [ ] Layout `(app)` chama `getUser()` / `requireUser()`
--- FIM ISSUE 2 ---"""

ISSUE_3 = """--- ISSUE 3 ---
# [Segurança] Endurecer grants de anon e função SECURITY DEFINER

**Labels sugeridas:** `security`, `informativa`

## Problema
1) `anon` e `authenticated` têm GRANT de SELECT/INSERT/UPDATE/DELETE/TRUNCATE em todas as tabelas `public` (padrão Supabase). O isolamento hoje vem só do RLS.
2) `handle_new_user()` é SECURITY DEFINER no schema `public` (`001_initial.sql:66-81`). EXECUTE atual: só `postgres` e `service_role`.

## Por que é explorável
Não é explorável hoje: RLS não tem policy para `anon`; a função não é executável pelo cliente. Fica perigoso se RLS for desligado, se nascer policy `to public`, ou se EXECUTE for concedido a `anon`/`authenticated`.

## Evidência
- `information_schema.role_table_grants` — anon ALL em profiles, workout_logs, body_metrics, exercises, workouts, workout_exercises
- `pg_policies` — policies apenas `TO authenticated`
- `supabase/migrations/001_initial.sql:66-81` — `security definer` + `set search_path = public`

## Impacto
Informativo (defesa em profundidade). Sem mudança de config, o Data API continua bloqueado para anônimo.

## Sugestão de correção
```sql
revoke all on all tables in schema public from anon;
grant select on public.exercises, public.workouts, public.workout_exercises to authenticated;
-- manter DML só nas tabelas do usuário, se quiser restringir ainda mais
```
Mover `handle_new_user` para schema privado (ex.: `private`) ou manter EXECUTE restrito (já está).

## Critérios de aceite
- [ ] `anon` sem GRANT de DML/TRUNCATE nas tabelas de dados do usuário
- [ ] RLS continua passando nos fluxos autenticados (hoje, perfil, log, métricas)
- [ ] EXECUTE de `handle_new_user` não está em `anon` nem `authenticated`
--- FIM ISSUE 3 ---"""


def build_story(data: dict, s: dict, donut: Path, bars: Path) -> list:
    story: list = []

    story.append(p("AUDITORIA DE APLICAÇÃO · 5 CATEGORIAS", s["cover_kicker"]))
    story.append(p(f"Relatório de Auditoria de Segurança — {data['project']}", s["cover_title"]))
    story.append(p(f"<b>Data:</b> 29 de agosto de 2026 &nbsp;·&nbsp; <b>Escopo:</b> código em <font face='Courier'>/home/ruda/Projetos/fitflow_home</font> (src/, supabase/migrations/, configs de deploy) e advisors/grants do projeto Supabase remoto.", s["body"]))
    story.append(p("<b>Nota metodológica.</b> Stack detectada: TypeScript, Next.js 16 App Router, React 19, Tailwind 4, Supabase Auth + Postgres com RLS (sem ORM; cliente PostgREST via supabase-js / @supabase/ssr). Deploy: Vercel. Sem Docker, CI, Helm ou Terraform. Sem repositório git local — histórico de commits não pôde ser varrido. Mapeamento das categorias:", s["body"]))
    story.append(
        ListFlowable(
            [
                ListItem(p("<b>1. Banco sem tranca</b> → RLS + policies + filtro <font face='Courier'>user_id</font>/<font face='Courier'>auth.uid()</font> nas server actions e em <font face='Courier'>data.ts</font>.", s["body"])),
                ListItem(p("<b>2. Permissão no navegador</b> → busca por papéis (isAdmin, canEdit, role). Não há modelo de admin; todos autenticados têm o mesmo privilégio.", s["body"])),
                ListItem(p("<b>3. IDOR</b> → único route handler de backend: <font face='Courier'>GET /auth/callback</font>; demais escritas são Server Actions; páginas (app) lidas uma a uma.", s["body"])),
                ListItem(p("<b>4. Chaves expostas</b> → grep em src/, migrations, README, DEPLOY, vercel.json, .env.example. Bundle: só a anon key pública (esperado). Sem .git.", s["body"])),
                ListItem(p("<b>5. XSS</b> → <font face='Courier'>dangerouslySetInnerHTML</font>, href/src dinâmicos, eval, markdown. Sem lib de sanitização no package.json.", s["body"])),
            ],
            bulletType="1",
            start="1",
            leftIndent=16,
        )
    )
    story.append(Spacer(1, 8))
    story.append(p("Achados apenas quando verificados no código ou no banco ao vivo. Sem especulação de ataque sem sink.", s["small"]))

    story.append(PageBreak())
    story.append(p("1. Resumo executivo", s["h1"]))
    findings = data["findings"]
    sev = {"crítica": 0, "alta": 0, "média": 0, "baixa": 0, "informativa": 0}
    for f in findings:
        sev[f["severity"]] += 1
    story.append(
        p(
            f"Foram registrados <b>{len(findings)} achados</b>: "
            f"crítica {sev['crítica']}, alta {sev['alta']}, média {sev['média']}, "
            f"baixa {sev['baixa']}, informativa {sev['informativa']}. "
            f"Nenhum crítico ou alto. O isolamento de dados do usuário (RLS + actions) está correto. "
            f"O achado mais relevante é configuração de senha no Auth (F1).",
            s["body"],
        )
    )

    charts = Table(
        [[Image(str(donut), width=8.2 * cm, height=8.2 * cm), Image(str(bars), width=9.2 * cm, height=5.8 * cm)]],
        colWidths=[8.6 * cm, 9.4 * cm],
    )
    charts.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    story.append(charts)
    story.append(Spacer(1, 10))

    story.append(p("2. Pontos fortes e pontos fracos", s["h1"]))
    story.append(p("Pontos fortes (verificados)", s["h2"]))
    fortes = [
        "<b>RLS ligado</b> em profiles, exercises, workouts, workout_exercises, workout_logs, body_metrics. Policies de dados do usuário usam <font face='Courier'>auth.uid()</font> (select/update/insert/delete próprios). Catálogo só SELECT para authenticated — sem policy de escrita = deny.",
        "<b>Triggers de dono</b> em <font face='Courier'>004_security_hardening.sql:39–81</font> forçam <font face='Courier'>user_id := auth.uid()</font> em body_metrics e workout_logs (spoof de user_id no insert é ignorado).",
        "<b>Server actions</b> (<font face='Courier'>src/lib/actions.ts</font>): as quatro funções chamam <font face='Courier'>requireAuthUser()</font> + <font face='Courier'>getUser()</font>. updateProfile/reset filtram <font face='Courier'>.eq('id'|'user_id', user.id)</font>. saveWorkoutLog valida UUID do treino de catálogo.",
        "<b>Páginas com dados</b> /hoje, /historico, /perfil, /treino/[code] chamam <font face='Courier'>requireUser()</font> e passam só <font face='Courier'>user.id</font> para getProfile/getWorkoutLogs/getBodyMetrics. RLS impede listar outro inquilino mesmo se o parâmetro mudasse.",
        "<b>IDOR:</b> nenhum handler busca objeto de usuário por ID de path/query/body sem posse. <font face='Courier'>/treino/[code]</font> só aceita A|B (catálogo). <font face='Courier'>/auth/callback</font> sanitiza <font face='Courier'>next</font> (obrigatório começar com <font face='Courier'>/</font> e não <font face='Courier'>//</font>) — <font face='Courier'>route.ts:4–8</font>.",
        "<b>Categoria 2 N/A:</b> não há isAdmin/canEdit/role no frontend. Resetar dados é UI de confirmação; o servidor revalida sessão em <font face='Courier'>resetUserData</font>.",
        "<b>Chaves:</b> sem service_role, JWT ou senha hardcoded em src/, SQL, vercel.json, .env.example (placeholders). .gitignore inclui <font face='Courier'>.env*</font>. Anon key em NEXT_PUBLIC_ é o modelo do Supabase.",
        "<b>XSS:</b> único <font face='Courier'>dangerouslySetInnerHTML</font> é script estático de tema (<font face='Courier'>layout.tsx:54–67</font>, chave fixa <font face='Courier'>fitflow-theme</font>). display_name e erros do Auth entram como texto React (escapados). Sem eval/markdown/v-html. Sem e-mails HTML no repo.",
        "<b>handle_new_user:</b> EXECUTE só postgres/service_role — não chamável por anon/authenticated.",
        "<b>Advisor RLS:</b> get_advisors(security) não apontou tabela sem RLS; só senha vazada.",
    ]
    story.append(
        ListFlowable([ListItem(p(t, s["body"])) for t in fortes], bulletType="bullet", leftIndent=12)
    )

    story.append(p("Pontos fracos (riscos centrais)", s["h2"]))
    fracos = [
        "Auth aceita senhas já vazadas (F1) — único achado de média.",
        "Cinto de autenticação do Next depende de env + requireUser por página; o proxy falha aberto e o layout (app) não fecha o segundo cinto (F2, F3).",
        "Grants padrão do Supabase para anon são amplos; o isolamento é 100% RLS (F4).",
        "Sem git local: não foi possível varrer histórico de segredos commitados.",
        "Sem Docker/CI/Helm/Terraform nesta pasta — categoria 4 nesses artefatos não se aplica.",
    ]
    story.append(
        ListFlowable([ListItem(p(t, s["body"])) for t in fracos], bulletType="bullet", leftIndent=12)
    )

    story.append(p("3. Achados detalhados por categoria", s["h1"]))
    story.append(
        p(
            "Cada linha foi conferida no arquivo (ou no banco/advisor). Paleta: crítica #B91C1C · alta #EA580C · média #D97706 · baixa #2563EB · informativa #6B7280.",
            s["small"],
        )
    )

    header = [
        p("<b>Sev.</b>", s["cell"]),
        p("<b>Arquivo:linha</b>", s["cell"]),
        p("<b>Descrição</b>", s["cell"]),
    ]
    rows = [header]
    for f in findings:
        chip = Table(
            [[p(f["severity"].upper(), s["chip"])]],
            colWidths=[2.3 * cm],
        )
        chip.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), chip_color(f["severity"])),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )
        loc = f"{f['file']}:{f['lines']}"
        desc = f"<b>{f['id']} · {f['title']}</b><br/>{f['description']}<br/><i>Explorável:</i> {f['exploitable']}<br/><i>Condição:</i> {f['condition']}"
        rows.append([chip, p(loc, s["cell"]), p(desc, s["cell"])])

    table = Table(rows, colWidths=[2.6 * cm, 5.2 * cm, 10.2 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFDF5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)

    story.append(p("Categoria 2 — permissão no navegador", s["h2"]))
    story.append(
        p(
            "Não se aplica como falha: o produto não tem papéis. A UI de “Resetar dados” só esconde o segundo clique de confirmação; <font face='Courier'>resetUserData</font> no servidor exige sessão e apaga só <font face='Courier'>user.id</font>. Troca de senha no cliente chama Auth com a senha atual e depois <font face='Courier'>updateUser</font> — o privilégio é a sessão, não um flag isAdmin.",
            s["body"],
        )
    )
    story.append(p("Categoria 3 — IDOR (cobertura)", s["h2"]))
    story.append(
        p(
            "Handlers percorridos: GET <font face='Courier'>src/app/auth/callback/route.ts</font>; actions saveWorkoutLog, saveBodyMetrics, updateProfile, resetUserData; páginas /hoje, /historico, /perfil, /treino/[code], /descanso. Nenhuma busca/altera/apaga registro de outro usuário por ID. <font face='Courier'>getProfile/getWorkoutLogs/getBodyMetrics</font> aceitam userId, mas os callers passam user.id e o RLS corta o resto.",
            s["body"],
        )
    )
    story.append(p("Categoria 5 — XSS (cobertura)", s["h2"]))
    story.append(
        p(
            "Não há lib de sanitização (DOMPurify etc.) e não foi necessário: não há sink de HTML com input do usuário. <font face='Courier'>ExerciseMedia</font> usa URLs do catálogo (escrita bloqueada por RLS). <font face='Courier'>AuthHeroBackground</font> e BottomNav usam paths estáticos. E-mails de reset são do Supabase Auth, fora deste repositório.",
            s["body"],
        )
    )

    story.append(p("4. Recomendações priorizadas", s["h1"]))
    recs = [
        "<b>P1 — F1.</b> Ativar Leaked Password Protection no Supabase Auth.",
        "<b>P2 — F2/F3.</b> Proxy fail-closed sem env; requireUser no layout (app); decidir se /descanso é público.",
        "<b>P3 — F4.</b> REVOKE de privilegios de anon nas tabelas de usuário (manter RLS).",
        "<b>P4 — F5.</b> Manter EXECUTE restrito; opcional mover handle_new_user para schema privado.",
        "<b>P5.</b> Inicializar git (ou confirmar remote) para passar a auditar histórico de segredos.",
        "<b>P6.</b> Validação de startup que recuse placeholders de .env.example.",
    ]
    story.append(ListFlowable([ListItem(p(t, s["body"])) for t in recs], bulletType="1", start="1", leftIndent=14))

    story.append(PageBreak())
    story.append(p("5. Issues para o GitHub", s["h1"]))
    story.append(
        p(
            "Texto completo, pronto para colar. Achados triviais do mesmo tema foram agrupados (F2+F3+validação de env; F4+F5).",
            s["small"],
        )
    )
    for block in (ISSUE_1, ISSUE_2, ISSUE_3):
        story.append(KeepTogether([
            Spacer(1, 6),
            Preformatted(block, s["issue"]),
            Spacer(1, 8),
        ]))

    return story


def rasterize(pdf_path: Path) -> list[Path]:
    import fitz

    PREVIEW_DIR.mkdir(exist_ok=True)
    doc = fitz.open(pdf_path)
    paths = []
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4), alpha=False)
        out = PREVIEW_DIR / f"pagina-{i:02d}.png"
        pix.save(str(out))
        paths.append(out)
    return paths


def main() -> None:
    data = load_findings()
    s = styles()
    donut, bars = make_charts(data)
    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=1.7 * cm,
        bottomMargin=1.7 * cm,
        title="Relatório de Auditoria de Segurança — FitFlow Home",
        author="Auditoria automatizada",
    )
    doc.build(build_story(data, s, donut, bars), onFirstPage=header_footer, onLaterPages=header_footer)
    previews = rasterize(OUT_PDF)
    print(f"PDF: {OUT_PDF}")
    print(f"Páginas: {len(previews)}")
    for pth in previews:
        print(f"Preview: {pth}")


if __name__ == "__main__":
    main()
