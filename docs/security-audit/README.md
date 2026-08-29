# Auditoria de segurança

## Regenerar o PDF

```bash
cd docs/security-audit
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python generate_report.py
```

Saída: `relatorio-auditoria-seguranca.pdf`  
Previews rasterizados: `_preview/pagina-*.png`
