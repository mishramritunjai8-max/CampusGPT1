def export_note(note, format: str):
    if format == "md":
        return (note.content or "").encode("utf-8"), "text/markdown", f"{note.title}.md"
    elif format == "pdf":
        try:
            from fpdf import FPDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.set_font("Courier", size=10)
            content = (note.content or "").replace("\r\n", "\n")
            for line in content.split("\n"):
                try:
                    pdf.cell(0, 5, line[:100], new_x="LMARGIN", new_y="NEXT")
                except:
                    try:
                        latin_line = line.encode("latin-1", "replace").decode("latin-1")
                        pdf.cell(0, 5, latin_line[:100], new_x="LMARGIN", new_y="NEXT")
                    except:
                        pdf.cell(0, 5, "[non-latin content]", new_x="LMARGIN", new_y="NEXT")
            return pdf.output(dest="S").encode("latin-1"), "application/pdf", f"{note.title}.pdf"
        except Exception as e:
            return str(e).encode(), "text/plain", "error.txt"
    elif format == "docx":
        try:
            from docx import Document
            doc = Document()
            doc.add_heading(note.title or "Note", 0)
            for line in (note.content or "").split("\n"):
                if line.strip():
                    doc.add_paragraph(line.strip())
            import io
            buf = io.BytesIO()
            doc.save(buf)
            return buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", f"{note.title}.docx"
        except Exception as e:
            return str(e).encode(), "text/plain", "error.txt"
    return (note.content or "").encode("utf-8"), "text/plain", f"{note.title}.txt"
